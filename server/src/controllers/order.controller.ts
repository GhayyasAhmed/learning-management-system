import "dotenv/config";
import { NextFunction, Request, Response } from "express";
import catchAsyncError from "../middlewares/catchAsyncError.js";
import CourseModel from "../models/course.model.js";
import NotificationModel from "../models/notification.models.js";
import OrderModel, { IOrder } from "../models/order.models.js";
import UserModel from "../models/user.model.js";
import ErrorHandler from "../utils/errorhandler.js";
import sendEmail from "../utils/sendEmail.js";



export const newOrder = catchAsyncError(async (data: IOrder, res: Response, next: NextFunction) => {
    try {
        const order = await OrderModel.create(data);

        res.status(201).json({
            success: true,
            message: "Order created successfully",
            order
        })

    }
    catch (error: any) {
        return next(new ErrorHandler(error.message, 400))

    }

})

export const createOrder = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { courseId, paymentInfo } = req.body as IOrder;
        const user = await UserModel.findById(req.user?._id)
        const courseExistInUser = user?.courses.some((course: any) => course._id.toString() === courseId)

        if (courseExistInUser) {
            return next(new ErrorHandler("You have already purchased this course", 400))
        }

        const course = await CourseModel.findById(courseId)
        if (!course) {
            return next(new ErrorHandler("Course not found", 400))
        }

        const data: any = {
            courseId: course._id?.toString(),
            userId: user?._id?.toString(),
            paymentInfo
        }


        const mailData = {
            order: {
                _id: course._id.toString().slice(0, 6),
                name: course.name,
                price: course.price,
                date: new Date().toLocaleDateString('en-US', { year: "numeric", month: "long", day: "numeric" })
            }
        }

        try {
            if (user) {
                await sendEmail({
                    email: user.email,
                    subject: "Order Confirmation",
                    template: "order-confirmation.ejs",
                    data: mailData
                });
            }

        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400));
        }

        user?.courses.push({ _id: course?._id?.toString() })

        await user?.save()

        await NotificationModel.create({
            userId: user?._id?.toString(),
            title: "New Order",
            message: `You have a new order from ${course?.name}`
        })

        if (typeof course.purchased === "number") {
            course.purchased += 1
            await course.save()
        }

        newOrder(data, res, next)

    }
    catch (error: any) {
        return next(new ErrorHandler(error.message, 400))

    }
})


export const getAllOrders = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try{
        const orders = await OrderModel.find().sort({createdAt: -1})

        res.status(201).json({
            success:true,
            orders
        })
    }catch (error: any) {
        return next(new ErrorHandler(error.message, 400))
    }

})