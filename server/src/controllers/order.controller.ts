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
import { isValidObjectId, isNonEmptyString } from "../utils/validators.js";

const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || "";
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";

// Initialize Stripe instance
const stripe = new Stripe(STRIPE_SECRET_KEY);

export const newOrder = catchAsyncError(
  async (data: IOrder, res: Response, next: NextFunction) => {
    try {
      const order = await OrderModel.create(data);

      res.status(201).json({
        success: true,
        message: "Order created successfully",
        order,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

interface IFulfillOrderParams {
  courseId: string;
  userId: string;
  paymentIntent: Stripe.PaymentIntent;
}

interface IFulfillOrderResult {
  alreadyProcessed: boolean;
  order?: any;
}

// Single, trusted order-fulfillment routine.
const fulfillCourseOrder = async ({
  courseId,
  userId,
  paymentIntent,
}: IFulfillOrderParams): Promise<IFulfillOrderResult> => {
  if (!isValidObjectId(courseId)) {
    throw new ErrorHandler("Invalid course ID", 400);
  }

  if (!isValidObjectId(userId)) {
    throw new ErrorHandler("Invalid user ID", 400);
  }

  const paymentIntentId = paymentIntent.id;

  // Idempotency fast-path
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

  // Best-effort side effects
  try {
    await NotificationModel.create({
      userId: user._id.toString(),
      title: "New Order",
      message: `You have a new order from ${course.name}`,
      type: "order",
      courseId: course._id.toString(),
    });
  } catch (error) {
    console.error(
      `Failed to create order notification for payment ${paymentIntentId}:`,
      error
    );
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
    console.error(
      `Failed to send order confirmation email for payment ${paymentIntentId}:`,
      error
    );
  }

  return { alreadyProcessed: false, order };
};

export const createOrder = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId, paymentInfo } = req.body as IOrder;

      if (!isNonEmptyString(courseId) || !isValidObjectId(courseId)) {
        return next(new ErrorHandler("Valid course ID is required", 400));
      }

      const normalizedCourseId = String(courseId);

      const course = (await CourseModel.findById(normalizedCourseId)) as any;
      if (!course) {
        return next(new ErrorHandler("Course not found.", 404));
      }

      // Payment verification
      if (
        !paymentInfo ||
        typeof paymentInfo !== "object" ||
        !("id" in paymentInfo)
      ) {
        return next(new ErrorHandler("Payment information is required", 400));
      }

      const paymentIntentId = String((paymentInfo as any).id);

      if (!isNonEmptyString(paymentIntentId)) {
        return next(new ErrorHandler("Invalid payment information", 400));
      }

      const paymentIntent = await stripe.paymentIntents.retrieve(
        paymentIntentId
      );
      if (paymentIntent.status !== "succeeded") {
        return next(new ErrorHandler("Payment not successful!", 400));
      }

      // Ensure PaymentIntent matches course and current price
      const expectedAmount = Math.round(Number(course.price) * 100);
      if (
        paymentIntent.metadata?.courseId !== normalizedCourseId ||
        paymentIntent.amount !== expectedAmount
      ) {
        return next(
          new ErrorHandler("Payment does not match this course", 400)
        );
      }

      const userId = req.user?._id ? String(req.user._id) : "";
      if (!isNonEmptyString(userId) || !isValidObjectId(userId)) {
        return next(
          new ErrorHandler("Please login to access this resource", 401)
        );
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

// Stripe webhook
export const stripeWebhook = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!STRIPE_WEBHOOK_SECRET) {
      return next(
        new ErrorHandler("Webhook is not configured on the server.", 500)
      );
    }

    const signature = req.headers["stripe-signature"];
    if (!signature || Array.isArray(signature)) {
      return next(
        new ErrorHandler("Missing or invalid Stripe signature.", 400)
      );
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        STRIPE_WEBHOOK_SECRET
      );
    } catch (error: any) {
      return next(
        new ErrorHandler(`Invalid webhook signature: ${error.message}`, 400)
      );
    }

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const courseId = paymentIntent.metadata?.courseId;
      const userId = paymentIntent.metadata?.userId;

      if (!isNonEmptyString(courseId) || !isNonEmptyString(userId)) {
        console.error(
          `Stripe webhook event ${event.id}: payment_intent.succeeded (${paymentIntent.id}) is missing courseId/userId metadata; skipping fulfillment.`
        );
        return res.status(200).json({ success: true, received: true });
      }

      if (!isValidObjectId(courseId) || !isValidObjectId(userId)) {
        console.error(
          `Stripe webhook event ${event.id}: Invalid courseId or userId format in metadata; skipping fulfillment.`
        );
        return res.status(200).json({ success: true, received: true });
      }

      try {
        await fulfillCourseOrder({ courseId, userId, paymentIntent });
      } catch (error: any) {
        if (error instanceof ErrorHandler) {
          console.error(
            `Stripe webhook event ${event.id} could not be fulfilled: ${error.message}`
          );
          return res.status(200).json({ success: true, received: true });
        }
        return next(error);
      }
    }

    return res.status(200).json({ success: true, received: true });
  }
);

export const getAllOrders = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orders = await OrderModel.find().sort({ createdAt: -1 });

      res.status(201).json({
        success: true,
        orders,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// Send stripe publishable key
export const sendStripePublishableKey = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    res.status(200).json({
      success: true,
      publishableKey: STRIPE_PUBLISHABLE_KEY,
    });
  }
);

// newPayment
export const newPayment = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!STRIPE_SECRET_KEY) {
        return next(
          new ErrorHandler(
            "Stripe is not configured on the server. Please contact support.",
            500
          )
        );
      }

      const { courseId } = req.body as { courseId?: string };

      if (!isNonEmptyString(courseId) || !isValidObjectId(courseId)) {
        return next(new ErrorHandler("Valid course ID is required", 400));
      }

      const course = await CourseModel.findById(courseId);
      if (!course) {
        return next(new ErrorHandler("Course not found.", 404));
      }

      const amount = Math.round(Number((course as any).price) * 100);
      if (!Number.isFinite(amount) || amount < 1) {
        return next(
          new ErrorHandler("This course is not purchasable", 400)
        );
      }

      const userId = req.user?._id ? String(req.user._id) : "";
      if (!isNonEmptyString(userId) || !isValidObjectId(userId)) {
        return next(
          new ErrorHandler("Please login to access this resource", 401)
        );
      }

      const myPayment: Stripe.PaymentIntent =
        await stripe.paymentIntents.create({
          amount,
          currency: "usd",
          metadata: {
            company: "ELearning",
            courseId: String(courseId),
            userId,
          },
          automatic_payment_methods: {
            enabled: true,
          },
        });

      res.status(201).json({
        client_secret: myPayment.client_secret,
        success: true,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);