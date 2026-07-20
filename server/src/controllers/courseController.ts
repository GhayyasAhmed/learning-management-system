import cloudinary from "cloudinary";
import "dotenv/config";
import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { redis } from "../config/redis.js";
import catchAsyncError from "../middlewares/catchAsyncError.js";
import CourseModel, { ICourse, IReview } from "../models/course.model.js";
import ErrorHandler from "../utils/errorhandler.js";
import sendEmail from "../utils/sendEmail.js";
import NotificationModel from "../models/notification.models.js";

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
    try {
        const userCourseList = req.user?.courses
        const courseId = req.params.id
        const courseExists = userCourseList?.find((course: any) => course._id.toString() === courseId)

        if (!courseExists) {
            return next(new ErrorHandler("You are not eligible to access this course", 404))
        }

        const course = await CourseModel.findById(courseId)

        if (!course) {
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


// add  question in course
interface IAddQuestionData {
    question: string;
    courseId: string;
    contentId: string;
}

export const addQuestion = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { question, courseId, contentId } = req.body as IAddQuestionData;

        if (!question) {
            return next(new ErrorHandler("Please provide a question text", 400));
        }

        if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(contentId)) {
            return next(new ErrorHandler("Invalid course or content id format", 400));
        }

        const newQuestion = {
            user: req.user?._id,
            question,
            questionReplies: [],
            createdAt: new Date()
        };

        const updatedCourse = await CourseModel.findOneAndUpdate(
            { _id: courseId, "courseData._id": contentId },
            {
                $push: { "courseData.$.questions": newQuestion }
            },
            { returnDocument: 'after', runValidators: true }
        );

        if (!updatedCourse) {
            return next(new ErrorHandler("Course or content module not found", 404));
        }

        const courseContent = updatedCourse?.courseData?.find((item: any) => item._id.equals(contentId))

        await NotificationModel.create({
            userId: req.user?._id?.toString(),
            title: "New Question",
            message: `You have a new question in ${courseContent?.title}`
        })


        res.status(200).json({
            success: true,
            message: "Question added successfully",
            course: updatedCourse
        });
    }
    catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});


interface IAddAnswerData {
    answer: string;
    courseId: string;
    contentId: string;
    questionId: string
}


export const addAnswer = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { answer, questionId, courseId, contentId } = req.body as IAddAnswerData;

        if (!answer) {
            return next(new ErrorHandler("Please provide an answer text", 400));
        }

        if (!mongoose.Types.ObjectId.isValid(questionId) || !mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(contentId)) {
            return next(new ErrorHandler("Invalid question, course, or content id format", 400));
        }


        const newAnswer = {
            user: req.user?._id,
            answer,
            createdAt: new Date()
        };

        let updatedCourse = await CourseModel.findOneAndUpdate(
            { _id: courseId },
            {
                $push: { "courseData.$[c].questions.$[q].questionReplies": newAnswer }
            },
            {
                returnDocument: 'after',
                runValidators: true,
                arrayFilters: [
                    { "c._id": contentId },
                    { "q._id": questionId }
                ]
            }
        );

        if (!updatedCourse) {
            return next(new ErrorHandler("Course, content, or question not found", 404));
        }

        updatedCourse = await updatedCourse.populate({
            path: "courseData.questions.user",
            select: "name email"
        });

        // Locate the specific content and question from the updated document map
        const courseContent = updatedCourse.courseData.find((item: any) => item._id.equals(contentId));
        const question = courseContent?.questions.find((q: any) => q._id.equals(questionId));

        if (!courseContent || !question) {
            return next(new ErrorHandler("Failed to extract updated question data", 500));
        }

        if (req.user?._id.toString() === question.user._id.toString()) {
            // Create a notification inside your database for the user
            await NotificationModel.create({
                userId: req.user?._id?.toString(),
                title: "New Question Reply Received",
                message: `You have a new question reply in ${courseContent?.title}`
            })
        } else {
            const data = {
                name: (question.user as unknown as { name: string }).name,
                title: courseContent.title,
            };

            try {
                await sendEmail({
                    email: (question.user as unknown as { email: string }).email,
                    subject: "Question Reply Notification",
                    template: "question-reply.ejs",
                    data
                });
            } catch (error: any) {
                return next(new ErrorHandler(error.message, 400));
            }
        }

        res.status(200).json({
            success: true,
            message: "Answer added successfully",
            course: updatedCourse
        });
    }
    catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
})

interface IAddReviewData {
    review: string;
    rating: number;
}

export const addReview = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userCourseList = req.user?.courses
        const courseId = req.params.id

        const courseExists = userCourseList?.some((course: any) => course._id.toString() === courseId);
        if (!courseExists) {
            return next(new ErrorHandler("Invalid course id", 404))
        }

        const course = await CourseModel.findById(courseId)
        if (!course) {
            return next(new ErrorHandler("Course not found", 404));
        }

        const { review, rating } = req.body as IAddReviewData
        const reviewData: IReview = {
            user: req.user?._id as mongoose.Types.ObjectId, // Assert type to match schema expectations
            review,
            rating,
            reviewReplies: [] // Satisfy structural clarity
        };

        course?.reviews.push(reviewData)

        let totalRating = 0;
        course.reviews.forEach((rev: any) => {
            totalRating += rev.rating;
        });

        if (course.reviews.length > 0) {
            course.rating = totalRating / course.reviews.length;
        }

        await course.save();

        // const notification = {
        //     title: "New Review Received",
        //     message: `${req.user?.name} has give a review in ${course?.name}`
        // }

        // create notification

        res.status(200).json({
            success: true,
            message: "Review added successfully",
            course
        });

    }
    catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }

})


interface IAddReviewReplyData {
    courseId: string;
    reviewId: string
    comment: string;
}

export const addReviewReply = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { reviewId, courseId, comment } = req.body as IAddReviewReplyData;
        if (!comment) {
            return next(new ErrorHandler("Please provide a valid reply text", 400));
        }

        if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(reviewId)) {
            return next(new ErrorHandler("Invalid review or content id format", 400));
        }

        const reply = {
            user: req.user?._id,
            comment,
        }

        let updatedCourse = await CourseModel.findOneAndUpdate(
            { _id: courseId, "reviews._id": reviewId },
            {
                $push: { "reviews.$.reviewReplies": reply }
            },
            {
                returnDocument: 'after',
                runValidators: true
            }
        );

        if (!updatedCourse) {
            return next(new ErrorHandler("Course or reviews module not found", 404));
        }

        res.status(200).json({
            success: true,
            message: "Review reply added successfully",
            course: updatedCourse
        });

    }
    catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
})