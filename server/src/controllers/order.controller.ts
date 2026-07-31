import "dotenv/config";
import { NextFunction, Request, Response } from "express";
import catchAsyncError from "../middlewares/catchAsyncError.js";
import CourseModel from "../models/course.model.js";
import NotificationModel from "../models/notification.models.js";
import OrderModel, { IOrder } from "../models/order.models.js";
import UserModel from "../models/user.model.js";
import ErrorHandler from "../utils/errorhandler.js";
import sendEmail from "../utils/sendEmail.js";
import Stripe from "stripe";
import { redis } from "../config/redis.js";

const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || '';
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

// Initialize Stripe instance
const stripe = new Stripe(STRIPE_SECRET_KEY);

export const newOrder = catchAsyncError(async (data: IOrder, res: Response, next: NextFunction) => {
    try {
        const order = await OrderModel.create(data);

        res.status(201).json({
            success: true,
            message: "Order created successfully",
            order
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

interface IFulfillOrderParams {
    courseId: string;
    userId: string;
    paymentIntent: Stripe.PaymentIntent;
}

interface IFulfillOrderResult {
    alreadyProcessed: boolean;
    order?: any;
}

// Single, trusted order-fulfillment routine. Both the client-confirmed
// checkout path (createOrder) and the Stripe webhook (stripeWebhook) route
// through this function so that a payment is enrolled/notified/emailed
// exactly once, no matter which path (or both, or a redelivered webhook
// event) triggers it.
const fulfillCourseOrder = async ({
    courseId,
    userId,
    paymentIntent,
}: IFulfillOrderParams): Promise<IFulfillOrderResult> => {
    const paymentIntentId = paymentIntent.id;

    // Idempotency fast-path: this exact payment has already been fulfilled
    // (e.g. the client-confirmed request and the Stripe webhook both fired
    // for the same PaymentIntent, or Stripe redelivered the same event).
    const existingOrder = await OrderModel.findOne({ paymentIntentId });
    if (existingOrder) {
        return { alreadyProcessed: true, order: existingOrder };
    }

    const course = await CourseModel.findById(courseId);
    if (!course) {
        throw new ErrorHandler("Course not found.", 404);
    }

    const user = await UserModel.findById(userId);
    if (!user) {
        throw new ErrorHandler("User not found.", 404);
    }

    const courseExistInUser = user.courses?.some((c: any) => {
        const id = c?.courseId ?? c?._id ?? c;
        return id && id.toString() === String(courseId);
    });

    let order;
    try {
        order = await OrderModel.create({
            courseId: course._id.toString(),
            userId: user._id.toString(),
            paymentInfo: paymentIntent,
            paymentIntentId,
        } as any);
    } catch (error: any) {
        // Duplicate key on paymentIntentId means a concurrent request (the
        // other fulfillment path, or a redelivered webhook) already created
        // the order for this payment. Treat this as an idempotent no-op
        // rather than an error.
        if (error?.code === 11000) {
            const raceWinner = await OrderModel.findOne({ paymentIntentId });
            return { alreadyProcessed: true, order: raceWinner ?? undefined };
        }
        throw error;
    }

    if (!courseExistInUser) {
        user.courses.push({ courseId: course._id.toString() } as any);
        await redis.set(String(user._id), JSON.stringify(user));
        await user.save();

        course.purchased = (course.purchased || 0) + 1;
        await course.save();
    }

    // Best-effort side effects: a failure here must not undo the order
    // record or enrollment already persisted above, and must not cause a
    // caller (in particular the Stripe webhook) to treat an already-successful
    // fulfillment as something that needs to be retried.
    try {
        await NotificationModel.create({
            userId: user._id.toString(),
            title: "New Order",
            message: `You have a new order from ${course.name}`,
            type: "order",
            courseId: course._id.toString(),
        });
    } catch (error) {
        console.error(`Failed to create order notification for payment ${paymentIntentId}:`, error);
    }

    try {
        await sendEmail({
            email: user.email,
            subject: "Order Confirmation!",
            template: "order-confirmation.ejs",
            data: {
                order: {
                    _id: course._id.toString().slice(0, 6),
                    name: course.name,
                    price: course.price,
                    date: new Date().toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                    }),
                },
            },
        });
    } catch (error) {
        console.error(`Failed to send order confirmation email for payment ${paymentIntentId}:`, error);
    }

    return { alreadyProcessed: false, order };
};

export const createOrder = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { courseId, paymentInfo } = req.body as IOrder;

            if (!courseId) {
                return next(new ErrorHandler("Course id is required", 400));
            }
            const normalizedCourseId = String(courseId);

            const course = (await CourseModel.findById(courseId)) as any;
            if (!course) {
                return next(new ErrorHandler("Course not found.", 404));
            }

            // Payment verification is mandatory: an order must never be created
            // without a verified, successful Stripe PaymentIntent.
            if (!paymentInfo || typeof paymentInfo !== "object" || !("id" in paymentInfo)) {
                return next(new ErrorHandler("Payment information is required", 400));
            }

            const paymentIntentId = String((paymentInfo as any).id);

            if (!paymentIntentId) {
                return next(new ErrorHandler("Invalid payment information", 400));
            }

            const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
            if (paymentIntent.status !== "succeeded") {
                return next(new ErrorHandler("Payment not successful!", 400));
            }

            // Ensure the verified PaymentIntent was actually created for this
            // course and for its current price, so a valid payment for one
            // course cannot be replayed to unlock a different (or re-priced)
            // course.
            const expectedAmount = Math.round(Number(course.price) * 100);
            if (
                paymentIntent.metadata?.courseId !== normalizedCourseId ||
                paymentIntent.amount !== expectedAmount
            ) {
                return next(new ErrorHandler("Payment does not match this course", 400));
            }

            const userId = req.user?._id ? String(req.user._id) : "";
            if (!userId) {
                return next(new ErrorHandler("Please login to access this resource", 401));
            }

            const user = await UserModel.findById(userId);
            if (!user) {
                return next(new ErrorHandler("User not found.", 404));
            }

            const courseExistInUser = user.courses?.some((c: any) => {
                const id = c?.courseId ?? c?._id ?? c;
                if (!id) return false;
                return id.toString() === normalizedCourseId;
            });

            if (courseExistInUser) {
                return next(
                    new ErrorHandler("You have already purchased this course.", 400)
                );
            }

            const { order } = await fulfillCourseOrder({
                courseId: normalizedCourseId,
                userId,
                paymentIntent,
            });

            res.status(201).json({
                success: true,
                message: "Order created successfully",
                order,
            });
        } catch (error: any) {
            if (error instanceof ErrorHandler) {
                return next(error);
            }
            return next(new ErrorHandler(error.message, 400));
        }
    }
);

// Stripe webhook: the trusted, authoritative source of truth for payment
// completion. Signature verification proves the event genuinely came from
// Stripe; fulfillment then routes through the same idempotent
// fulfillCourseOrder used by createOrder, so redelivered/duplicate events
// (and overlap with the client-confirmed path) never double-enroll,
// double-notify, or double-email.
export const stripeWebhook = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    if (!STRIPE_WEBHOOK_SECRET) {
        return next(new ErrorHandler("Webhook is not configured on the server.", 500));
    }

    const signature = req.headers["stripe-signature"];
    if (!signature || Array.isArray(signature)) {
        return next(new ErrorHandler("Missing or invalid Stripe signature.", 400));
    }

    let event: Stripe.Event;
    try {
        // req.body must be the raw request buffer (see app.ts route
        // registration, which applies express.raw() to this path before the
        // global express.json() parser) for signature verification to succeed.
        event = stripe.webhooks.constructEvent(req.body, signature, STRIPE_WEBHOOK_SECRET);
    } catch (error: any) {
        return next(new ErrorHandler(`Invalid webhook signature: ${error.message}`, 400));
    }

    if (event.type === "payment_intent.succeeded") {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const courseId = paymentIntent.metadata?.courseId;
        const userId = paymentIntent.metadata?.userId;

        if (!courseId || !userId) {
            console.error(
                `Stripe webhook event ${event.id}: payment_intent.succeeded (${paymentIntent.id}) is missing courseId/userId metadata; skipping fulfillment.`
            );
            return res.status(200).json({ success: true, received: true });
        }

        try {
            await fulfillCourseOrder({ courseId, userId, paymentIntent });
        } catch (error: any) {
            if (error instanceof ErrorHandler) {
                // Non-retryable data problem (e.g. course/user no longer
                // exists). Acknowledge so Stripe stops retrying an event we
                // can never fulfill.
                console.error(`Stripe webhook event ${event.id} could not be fulfilled: ${error.message}`);
                return res.status(200).json({ success: true, received: true });
            }
            // Unknown/transient failure — propagate so this responds non-2xx
            // and Stripe retries delivery later. fulfillCourseOrder's
            // idempotency guard makes retries safe.
            return next(error);
        }
    }

    // Acknowledge all other event types without processing them, so Stripe
    // does not keep retrying events this endpoint intentionally ignores.
    return res.status(200).json({ success: true, received: true });
});

export const getAllOrders = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const orders = await OrderModel.find().sort({ createdAt: -1 });

        res.status(201).json({
            success: true,
            orders
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// Send stripe publishable key
export const sendStripePublishableKey = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    res.status(200).json({
        success: true,
        publishableKey: STRIPE_PUBLISHABLE_KEY
    });
});

// newPayment
export const newPayment = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!STRIPE_SECRET_KEY) {
            return next(
                new ErrorHandler(
                    "Stripe is not configured on the server. Please contact support.",
                    500,
                ),
            );
        }

        const { courseId } = req.body as { courseId?: string };
        if (!courseId) {
            return next(new ErrorHandler("Course id is required", 400));
        }
        const course = await CourseModel.findById(courseId);
        if (!course) {
            return next(new ErrorHandler("Course not found.", 404));
        }
        const amount = Math.round(Number((course as any).price) * 100);
        if (!Number.isFinite(amount) || amount < 1) {
            return next(new ErrorHandler("This course is not purchasable", 400));
        }

        const myPayment: Stripe.PaymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: 'usd',
            metadata: {
                company: "ELearning",
                courseId: String(courseId),
                // Stored by our own server at PaymentIntent-creation time (not
                // supplied by the client), so the webhook can later trust this
                // value to know which user to enroll.
                userId: String(req.user?._id || ""),
            },
            automatic_payment_methods: {
                enabled: true,
            }
        });

        res.status(201).json({
            client_secret: myPayment.client_secret,
            success: true
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
});