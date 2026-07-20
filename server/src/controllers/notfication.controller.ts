import "dotenv/config";
import { NextFunction, Request, Response } from "express";
import catchAsyncError from "../middlewares/catchAsyncError.js";
import CourseModel from "../models/course.model.js";
import NotificationModel from "../models/notification.models.js";
import OrderModel, { IOrder } from "../models/order.models.js";
import UserModel from "../models/user.model.js";
import ErrorHandler from "../utils/errorhandler.js";
import sendEmail from "../utils/sendEmail.js";


// only for admin
export const getAllNotifications = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const notifications = await NotificationModel.find().sort({ createdAt: -1 })

        res.status(200).json({
            success: true,
            notifications
        })

    }
    catch (error: any) {
        return next(new ErrorHandler(error.message, 400))

    }

})


interface INotificationStatusUpdateRequest{
    status: string;
}

export const updateNotificationStatus = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = req.params.id;
        const notification = await NotificationModel.findById(id)
        if(!notification){
            return next(new ErrorHandler("Invalid notification id", 404))
        }

        const {status} = req.body as INotificationStatusUpdateRequest
        notification.status = status
        await notification.save()

        const notifications = await NotificationModel.find().sort({ createdAt: -1 })

        res.status(200).json({
            success: true,
            message: "notification status updated successfully",
            notifications
        })
    }
    catch (error: any) {
        return next(new ErrorHandler(error.message, 400))

    }
})