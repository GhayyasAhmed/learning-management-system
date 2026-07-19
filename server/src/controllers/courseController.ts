import cloudinary from "cloudinary";
import "dotenv/config";
import { NextFunction, Request, Response } from "express";
import catchAsyncError from "../middlewares/catchAsyncError.js";
import CourseModel, { ICourse } from "../models/course.model.js";
import ErrorHandler from "../utils/errorhandler.js";
import { redis } from "../config/redis.js";

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
        if (thumbnail) {
            const result = await cloudinary.v2.uploader.upload(thumbnail, {
                folder: "courses"
            })

            data.thumbnail = {
                public_id: result.public_id,
                url: result.secure_url
            }
        }

        createCourse(data, res, next)

    }
    catch (error: any) {
        return next(new ErrorHandler(error.message, 400))

    }
})


// Define what the thumbnail looks like when it's an object in the DB
interface IStoredThumbnail {
    public_id: string;
    url: string;
}

export const editCourse = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params
        let course = await CourseModel.findById(id)
        if (!course) {
            return next(new ErrorHandler("Course not found", 404));
        }
        const data = req.body as ICourse
        const thumbnail = data.thumbnail

        const savedThumbnail = course.thumbnail as IStoredThumbnail;

        // If a new thumbnail string is sent, destroy the old one and upload the new one
        if (thumbnail && typeof thumbnail === "string" && thumbnail.startsWith("data:image")) {
            // Check if the course already has a public_id stored to delete it from Cloudinary

            if (savedThumbnail && savedThumbnail.public_id) {
                await cloudinary.v2.uploader.destroy(savedThumbnail.public_id);
            }

            const result = await cloudinary.v2.uploader.upload(thumbnail, {
                folder: "courses"
            });

            data.thumbnail = {
                public_id: result.public_id,
                url: result.secure_url
            };
        } else {
            // Keep existing thumbnail if no new one was provided in the update payload
            data.thumbnail = course.thumbnail;
        }

        // Fix: Use Mongoose's native .set method to safely merge changes into the document
        course.set(data);
        const updatedCourse = await course.save();

        res.status(200).json({
            success: true,
            message: "Course updated successfully",
            data: updatedCourse
        });
    }
    catch (error: any) {
        return next(new ErrorHandler(error.message, 400))

    }
})


export const getSingleCourseWithoutPurchase = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params

        if (!id || typeof id !== "string") {
            return next(new ErrorHandler("Invalid course id", 400));
        }

        const isCacheExist = await redis.get(id)
        if (isCacheExist) {
            const course = JSON.parse(isCacheExist)
            return res.status(200).json({
                success: true,
                course
            });
        }
        const course = await CourseModel.findById(id).select("-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links")

        if (!course) {
            return next(new ErrorHandler("Course not found", 404));
        }

        await redis.set(id, JSON.stringify(course))


        res.status(200).json({
            success: true,
            course
        });
    }
    catch (error: any) {
        return next(new ErrorHandler(error.message, 400))

    }
})


export const getAllCourseWithoutPurchase = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const isCacheExist = await redis.get("allCourses")
        if (isCacheExist) {
            const courses = JSON.parse(isCacheExist)
            return res.status(200).json({
                success: true,
                courses
            });
        }
        const courses = await CourseModel.find({}).select("-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links")
        await redis.set("allCourses", JSON.stringify(courses))
        
        res.status(200).json({
            success: true,
            courses
        });
    }
    catch (error: any) {
        return next(new ErrorHandler(error.message, 400))

    }
})



// get course content -- only for valid user
export const getCourseByUser = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try{
        const userCourseList = req.user?.courses
        const courseId = req.params.id
        const courseExists = userCourseList?.find((course: any) => course._id.toString() === courseId)

        if(!courseExists){
            return next(new ErrorHandler("You are not eligible to access this course", 404))
        }

        const course = await CourseModel.findById(courseId)

        if(!course){
            return next(new ErrorHandler("Invalid course id", 404))
        }

        const content = course?.courseData

        res.status(200).json({
            success: true,
            data: content
        })

    }
    catch (error: any) {
        return next(new ErrorHandler(error.message, 400))

    }
})
