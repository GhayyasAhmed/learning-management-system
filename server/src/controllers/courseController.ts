import axios from "axios";
import cloudinary from "cloudinary";
import "dotenv/config";
import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { redis } from "../config/redis.js";
import catchAsyncError from "../middlewares/catchAsyncError.js";
import CourseModel, { ICourse, IReview } from "../models/course.model.js";
import NotificationModel from "../models/notification.models.js";
import ErrorHandler from "../utils/errorhandler.js";
import sendEmail from "../utils/sendEmail.js";
import { isNonEmptyString, isValidObjectId } from "../utils/validators.js";

interface IStoredThumbnail {
    public_id: string;
    url: string;
}

// Helper function to update the sanitized course cache in Redis for public preview
export const updatePublicCourseCache = async (courseId: string) => {
    try {
        const course = await CourseModel.findById(courseId)
            .select("-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links")
            .populate({
                path: "reviews.user",
                select: "name avatar role",
            })
            .populate({
                path: "reviews.reviewReplies.user",
                select: "name avatar role",
            })
            .lean();

        if (course) {
            await redis.set(courseId, JSON.stringify(course), "EX", 604800);
        }
        return course;
    } catch (error) {
        console.error("Failed to update public course Redis cache:", error);
        return null;
    }
};

export const createCourse = catchAsyncError(
    async (data: ICourse, res: Response, next: NextFunction) => {
        try {
            const course = await CourseModel.create(data);
            res.status(201).json({
                success: true,
                course,
                message: "Course created successfully",
            });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400));
        }
    }
);

export const uploadCourse = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = req.body;
            const thumbnail = data.thumbnail;
            if (thumbnail) {
                const result = await cloudinary.v2.uploader.upload(thumbnail, {
                    folder: "courses",
                });

                data.thumbnail = {
                    public_id: result.public_id,
                    url: result.secure_url,
                };
            }

            createCourse(data, res, next);
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400));
        }
    }
);

export const editCourse = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;

             if (!isValidObjectId(id)) {
                return next(new ErrorHandler("Invalid course id", 400));
            }

            let course = await CourseModel.findById(id);
            if (!course) {
                return next(new ErrorHandler("Course not found", 404));
            }
            const data = req.body as ICourse;
            const thumbnail = data.thumbnail;

            const savedThumbnail = course.thumbnail as IStoredThumbnail;

            if (
                thumbnail &&
                typeof thumbnail === "string" &&
                thumbnail.startsWith("data:image")
            ) {
                if (savedThumbnail && savedThumbnail.public_id) {
                    await cloudinary.v2.uploader.destroy(savedThumbnail.public_id);
                }

                const result = await cloudinary.v2.uploader.upload(thumbnail, {
                    folder: "courses",
                });

                data.thumbnail = {
                    public_id: result.public_id,
                    url: result.secure_url,
                };
            } else {
                data.thumbnail = course.thumbnail;
            }

            course.set(data);
            await course.save();

            await updatePublicCourseCache(id as string);

            res.status(200).json({
                success: true,
                message: "Course updated successfully",
                data: course,
            });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400));
        }
    }
);

export const getSingleCourseWithoutPurchase = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;

            if (!id || typeof id !== "string") {
                return next(new ErrorHandler("Invalid course id", 400));
            }

            const isCacheExist = await redis.get(id);
            if (isCacheExist) {
                const course = JSON.parse(isCacheExist);
                return res.status(200).json({
                    success: true,
                    course,
                });
            }

            const course = await CourseModel.findById(id)
                .select("-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links")
                .populate({
                    path: "reviews.user",
                    select: "name avatar role",
                })
                .populate({
                    path: "reviews.reviewReplies.user",
                    select: "name avatar role",
                })
                .lean();

            if (!course) {
                return next(new ErrorHandler("Course not found", 404));
            }

            await redis.set(id, JSON.stringify(course), "EX", 604800);

            res.status(200).json({
                success: true,
                course,
            });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400));
        }
    }
);

export const getAllCourseWithoutPurchase = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const courses = await CourseModel.find({}).select(
                "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links"
            )
            .lean();

            res.status(200).json({
                success: true,
                courses,
            });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400));
        }
    }
);

export const getCourseByUser = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userCourseList = req.user?.courses;
            const courseId = req.params.id;

            const isEnrolled = userCourseList?.some(
                (item: any) => item._id === courseId || item.courseId === courseId
            );

            if (!isEnrolled && req.user?.role !== "admin") {
                return next(
                    new ErrorHandler("You are not eligible to access this course", 404)
                );
            }

            // Deep populate questions & questionReplies user details
            const course = await CourseModel.findById(courseId).populate([
                {
                    path: "courseData.questions.user",
                    select: "name avatar role email",
                },
                {
                    path: "courseData.questions.questionReplies.user",
                    select: "name avatar role email",
                },
            ]).lean();

            if (!course) {
                return next(new ErrorHandler("Invalid course id", 404));
            }

            const content = course.courseData;

            res.status(200).json({
                success: true,
                content,
            });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400));
        }
    }
);

interface IAddQuestionData {
    question: string;
    courseId: string;
    contentId: string;
}

export const addQuestion = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { question, courseId, contentId } = req.body as IAddQuestionData;

            if (!question) {
                return next(new ErrorHandler("Please provide a question text", 400));
            }

            if (
                !mongoose.Types.ObjectId.isValid(courseId) ||
                !mongoose.Types.ObjectId.isValid(contentId)
            ) {
                return next(new ErrorHandler("Invalid course or content id format", 400));
            }

            const newQuestion = {
                user: req.user?._id,
                question,
                questionReplies: [],
                createdAt: new Date(),
            };

            const updatedCourse = await CourseModel.findOneAndUpdate(
                { _id: courseId, "courseData._id": contentId },
                {
                    $push: { "courseData.$.questions": newQuestion },
                },
                { returnDocument: "after", runValidators: true }
            )
                .populate({
                    path: "courseData.questions.user",
                    select: "name avatar role email",
                })
                .populate({
                    path: "courseData.questions.questionReplies.user",
                    select: "name avatar role email",
                })
                .lean();

            if (!updatedCourse) {
                return next(new ErrorHandler("Course or content module not found", 404));
            }

            await updatePublicCourseCache(courseId);

            const courseContent = updatedCourse?.courseData?.find((item: any) =>
                item._id.equals(contentId)
            );
            const addedQuestion = courseContent?.questions?.[courseContent.questions.length - 1];

            await NotificationModel.create({
                userId: req.user?._id?.toString(),
                title: "New Question",
                message: `You have a new question in ${courseContent?.title}`,
                type: "question",
                courseId,
                contentId,
                questionId: addedQuestion?._id?.toString(),
            });

            res.status(200).json({
                success: true,
                message: "Question added successfully",
                content: updatedCourse.courseData,
            });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400));
        }
    }
);

interface IAddAnswerData {
    answer: string;
    courseId: string;
    contentId: string;
    questionId: string;
}

export const addAnswer = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { answer, questionId, courseId, contentId } = req.body as IAddAnswerData;

            if (!answer) {
                return next(new ErrorHandler("Please provide an answer text", 400));
            }

            if (
                !mongoose.Types.ObjectId.isValid(questionId) ||
                !mongoose.Types.ObjectId.isValid(courseId) ||
                !mongoose.Types.ObjectId.isValid(contentId)
            ) {
                return next(
                    new ErrorHandler("Invalid question, course, or content id format", 400)
                );
            }

            const isEnrolled = req.user?.courses?.some(
                (item: any) => item._id === courseId || item.courseId === courseId
            );
            if (!isEnrolled && req.user?.role !== "admin") {
                return next(new ErrorHandler("You are not eligible to access this course", 403));
            }

            const newAnswer = {
                user: req.user?._id,
                answer,
                createdAt: new Date(),
            };

            let updatedCourse = await CourseModel.findOneAndUpdate(
                { _id: courseId },
                {
                    $push: { "courseData.$[c].questions.$[q].questionReplies": newAnswer },
                },
                {
                    returnDocument: "after",
                    runValidators: true,
                    arrayFilters: [{ "c._id": contentId }, { "q._id": questionId }],
                }
            )
                .populate({
                    path: "courseData.questions.user",
                    select: "name email avatar role",
                })
                .populate({
                    path: "courseData.questions.questionReplies.user",
                    select: "name email avatar role",
                })
                .lean();

            if (!updatedCourse) {
                return next(new ErrorHandler("Course, content, or question not found", 404));
            }

            await updatePublicCourseCache(courseId);

            const courseContent = updatedCourse.courseData.find((item: any) =>
                item._id.equals(contentId)
            );
            const question = courseContent?.questions.find((q: any) =>
                q._id.equals(questionId)
            );

            if (!courseContent || !question) {
                return next(
                    new ErrorHandler("Failed to extract updated question data", 500)
                );
            }

            if (req.user?._id.toString() === question.user._id.toString()) {
                await NotificationModel.create({
                    userId: req.user?._id?.toString(),
                    title: "New Question Reply Received",
                    message: `You have a new question reply in ${courseContent?.title}`,
                    type: "question_reply",
                    courseId,
                    contentId,
                    questionId,
                });
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
                        data,
                    });
                } catch (error: any) {
                    return next(new ErrorHandler(error.message, 400));
                }
            }

            res.status(200).json({
                success: true,
                message: "Answer added successfully",
                content: updatedCourse.courseData, // Returns populated content matching getCourseByUser
            });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400));
        }
    }
);

interface IAddReviewData {
    review: string;
    rating: number;
}

export const addReview = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userCourseList = req.user?.courses;
            const courseId = req.params.id;

            if (!courseId || typeof courseId !== "string") {
                return next(new ErrorHandler("Invalid course id", 400));
            }

            const courseExists = userCourseList?.some(
                (course: any) => course.courseId === courseId
            );
            if (!courseExists && req.user?.role !== "admin") {
                return next(new ErrorHandler("Invalid course id", 404));
            }

            const course = await CourseModel.findById(courseId);
            if (!course) {
                return next(new ErrorHandler("Course not found", 404));
            }

            const alreadyReviewed = course.reviews.some(
                (rev: any) => rev.user?.toString() === req.user?._id?.toString()
            );
            if (alreadyReviewed) {
                return next(new ErrorHandler("You have already reviewed this course", 400));
            }

            const { review, rating } = req.body as IAddReviewData;

            if (!isNonEmptyString(review)) {
                return next(new ErrorHandler("Please provide a review text", 400));
            }

            if (typeof rating !== "number" || rating < 1 || rating > 5) {
                return next(new ErrorHandler("Rating must be between 1 and 5", 400));
            }

            const reviewData: IReview = {
                user: req.user?._id as mongoose.Types.ObjectId,
                review,
                rating,
                reviewReplies: [],
            };

            course.reviews.push(reviewData);

            let totalRating = 0;
            course.reviews.forEach((rev: any) => {
                totalRating += rev.rating;
            });

            if (course.reviews.length > 0) {
                course.rating = totalRating / course.reviews.length;
            }

            await course.save();

            await updatePublicCourseCache(courseId);
            const createdReview = course.reviews[course.reviews.length - 1];
            
            const updatedCourse = await CourseModel.findById(courseId)
                .select("-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links")
                .populate({
                    path: "reviews.user",
                    select: "name avatar role",
                })
                .populate({
                    path: "reviews.reviewReplies.user",
                    select: "name avatar role",
                });

            await NotificationModel.create({
                userId: req.user?._id?.toString(),
                title: "New Review Received",
                message: `${req.user?.name} has given a new review for ${course?.name}`,
                type: "review",
                courseId,
                reviewId: createdReview?._id?.toString(),
            });

            res.status(200).json({
                success: true,
                message: "Review added successfully",
                course: updatedCourse,
            });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400));
        }
    }
);

interface IAddReviewReplyData {
    courseId: string;
    reviewId: string;
    comment: string;
}

export const addReviewReply = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { reviewId, courseId, comment } = req.body as IAddReviewReplyData;
            if (!comment) {
                return next(new ErrorHandler("Please provide a valid reply text", 400));
            }

            if (
                !mongoose.Types.ObjectId.isValid(courseId) ||
                !mongoose.Types.ObjectId.isValid(reviewId)
            ) {
                return next(new ErrorHandler("Invalid review or content id format", 400));
            }

            const reply = {
                user: req.user?._id,
                comment,
            };

            const updatedCourse = await CourseModel.findOneAndUpdate(
                { _id: courseId, "reviews._id": reviewId },
                {
                    $push: { "reviews.$.reviewReplies": reply },
                },
                {
                    returnDocument: "after",
                    runValidators: true,
                }
            )
                .populate({
                    path: "reviews.user",
                    select: "name avatar role",
                })
                .populate({
                    path: "reviews.reviewReplies.user",
                    select: "name avatar role",
                })
                .lean();

            if (!updatedCourse) {
                return next(new ErrorHandler("Course or reviews module not found", 404));
            }

            // Flush Redis cache for this course ID to ensure fresh data fetch
            await redis.del(courseId);
            await updatePublicCourseCache(courseId);

            res.status(200).json({
                success: true,
                message: "Review reply added successfully",
                course: updatedCourse,
            });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400));
        }
    }
);

export const getAllCourses = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const courses = await CourseModel.find().sort({ createdAt: -1 }).lean();

            res.status(201).json({
                success: true,
                courses,
            });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400));
        }
    }
);

export const deleteCourse = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { courseId } = req.body;

            if (!isValidObjectId(courseId)) {
                return next(new ErrorHandler("Invalid course id", 400));
            }

            const course = await CourseModel.findById(courseId);
            if (!course) {
                return next(new ErrorHandler("Course not found", 404));
            }

            await course.deleteOne();
            await redis.del(courseId);

            res.status(200).json({
                success: true,
                message: "Course deleted successfully",
            });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400));
        }
    }
);

export const generateVideoUrl = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { videoId } = req.body;
            if (!isNonEmptyString(videoId)) {
                return next(new ErrorHandler("Please provide a valid video id", 400));
            }
            const response = await axios.post(
                `https://dev.vdocipher.com/api/videos/${videoId}/otp`,
                { ttl: 300 },
                {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                        Authorization: `Apisecret ${process.env.VDOCIPHER_API_SECRET}`,
                    },
                }
            );

            res.json(response.data);
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400));
        }
    }
);