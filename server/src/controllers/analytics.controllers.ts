import "dotenv/config";
import { NextFunction, Request, Response } from "express";
import catchAsyncError from "../middlewares/catchAsyncError.js";
import CourseModel from "../models/course.model.js";
import OrderModel from "../models/order.models.js";
import UserModel from "../models/user.model.js";
import { generateLast12MothsData } from "../utils/analytics.generator.js";
import ErrorHandler from "../utils/errorhandler.js";
import { analyticsCacheKey, cacheGet, cacheSet } from "../config/redis.js";


export const getUserAnalytics = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const cacheKey = analyticsCacheKey("users");
        const cached = await cacheGet(cacheKey);
        if (cached) {
            return res.status(200).json({
                success: true,
                users: JSON.parse(cached),
            });
        }

        const users = await generateLast12MothsData(UserModel)
        await cacheSet(cacheKey, JSON.stringify(users), 300);

        res.status(200).json({
            success: true,
            users
        })
    }
    catch (error: any) {
        return next(new ErrorHandler(error.message, 400))
    }
})


export const getCourseAnalytics = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const cacheKey = analyticsCacheKey("courses");
        const cached = await cacheGet(cacheKey);
        if (cached) {
            return res.status(200).json({
                success: true,
                courses: JSON.parse(cached),
            });
        }

        const courses = await generateLast12MothsData(CourseModel)
        await cacheSet(cacheKey, JSON.stringify(courses), 300);

        res.status(200).json({
            success: true,
            courses
        })
    }
    catch (error: any) {
        return next(new ErrorHandler(error.message, 400))
    }
})


export const getOrderAnalytics = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const cacheKey = analyticsCacheKey("orders");
        const cached = await cacheGet(cacheKey);
        if (cached) {
            return res.status(200).json({
                success: true,
                orders: JSON.parse(cached),
            });
        }

        const orders = await generateLast12MothsData(OrderModel)
        await cacheSet(cacheKey, JSON.stringify(orders), 300);

        res.status(200).json({
            success: true,
            orders
        })
    }
    catch (error: any) {
        return next(new ErrorHandler(error.message, 400))
    }
})