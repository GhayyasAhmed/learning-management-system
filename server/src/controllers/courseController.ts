import "dotenv/config";
import { NextFunction, Request, Response } from "express";
import UserModel, { IUser } from "../models/user.model.js";
import catchAsyncError from "../middlewares/catchAsyncError.js";
import CourseModel, {ICourse} from "../models/course.model.js";
import ErrorHandler from "../utils/errorhandler.js";
import cloudinary from "cloudinary";

export const createCourse = catchAsyncError(async (data: ICourse, res: Response, next: NextFunction) => {
    try {
        const course = await CourseModel.create(data);
        res.status(201).json({
            success: true,
            course,
            message: "Course created successfully"
        })
        
    }
    catch (error: any) {
        return next(new ErrorHandler(error.message, 400))

    }
})


export const uploadCourse = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = req.body
        const thumbnail = data.thumbnail
        if(thumbnail){
            const result = await cloudinary.v2.uploader.upload(thumbnail, {
                folder: "courses"
            })

            data.thumbnail = {
                public_id: result.public_id,
                url: result.secure_url
            }
        }

        createCourse(data,res,next)

    }
    catch (error: any) {
        return next(new ErrorHandler(error.message, 400))

    }
})