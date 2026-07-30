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
            // without a verified, successful Stripe PaymentIntent. Previously
            // this check only ran "if paymentInfo was provided", so omitting
            // paymentInfo entirely skipped verification and let the order
            // through unpaid.
            if (!paymentInfo || typeof paymentInfo !== "object" || !("id" in paymentInfo)) {
                return next(new ErrorHandler("Payment information is required", 400));
            }

            const paymentIntentId = String((paymentInfo as any).id); // 💡 Fixed TS2345 by explicitly coercing to string

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
            // course. `newPayment` already sets metadata.courseId and computes
            // the amount from the course price when creating the intent.
            const expectedAmount = Math.round(Number(course.price) * 100);
            if (
                paymentIntent.metadata?.courseId !== normalizedCourseId ||
                paymentIntent.amount !== expectedAmount
            ) {
                return next(new ErrorHandler("Payment does not match this course", 400));
            }

            // Check if the course is already purchased by the user
            const userId = req.user?._id ? String(req.user._id) : "";
            const user = userId ? await UserModel.findById(userId) : null;
            const courseExistInUser = user?.courses?.some((c: any) => {
                // tolerate historical bad data where `courses` items might be raw ids/strings
                const id = c?.courseId ?? c?._id ?? c;
                if (!id) return false;
                return id.toString() === normalizedCourseId;
            });

            if (courseExistInUser) {
                return next(
                    new ErrorHandler("You have already purchased this course.", 400)
                );
            }

            const data: any = {
                courseId: course._id?.toString(),
                userId: user?._id?.toString(),
                paymentInfo,
            };

            const mailData = {
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
            };

            try {
                if (user) {
                    await sendEmail({
                        email: user.email,
                        subject: "Order Confirmation!",
                        template: "order-confirmation.ejs",
                        data: mailData,
                    });
                }
            } catch (error: any) {
                return next(new ErrorHandler(error.message, 400));
            }

            // Store consistently with the user schema: { courseId: string }
            if (user) {
                user.courses.push({ courseId: course._id.toString() } as any);
                await redis.set(String(user._id), JSON.stringify(user));
                await user.save();
            }

            course.purchased = (course.purchased || 0) + 1;
            await course.save();

            if (user?._id) {
                await NotificationModel.create({
                    userId: user?._id?.toString(),
                    title: "New Order",
                    message: `You have a new order from ${course.name}`,
                    type: "order",
                    courseId: course._id?.toString(),
                });
            }

            newOrder(data, res, next);
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400));
        }
    }
);

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