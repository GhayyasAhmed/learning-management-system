import "dotenv/config";
import { NextFunction, Response } from "express";
import catchAsyncError from "../middlewares/catchAsyncError.js";
import CourseModel, { ICourse } from "../models/course.model.js";
import OrderModel from "../models/order.models.js";
import UserModel from "../models/user.model.js";
import { generateLast12MothsData } from "../utils/analytics.generator.js";
import ErrorHandler from "../utils/errorhandler.js";


export const getUserAnalytics = catchAsyncError(async (data: ICourse, res: Response, next: NextFunction) => {
    try {
        const users = await generateLast12MothsData(UserModel)

        res.status(200).json({
            success: true,
            users
        })

    }
    catch (error: any) {
        return next(new ErrorHandler(error.message, 400))

    }
})


export const getCourseAnalytics = catchAsyncError(async (data: ICourse, res: Response, next: NextFunction) => {
    try {
        const course = await generateLast12MothsData(CourseModel)

        res.status(200).json({
            success: true,
            course
        })

    }
    catch (error: any) {
        return next(new ErrorHandler(error.message, 400))

    }
})



export const getOrderAnalytics = catchAsyncError(async (data: ICourse, res: Response, next: NextFunction) => {
    try {
        const order = await generateLast12MothsData(OrderModel)

        res.status(200).json({
            success: true,
            order
        })

    }
    catch (error: any) {
        return next(new ErrorHandler(error.message, 400))

    }
})