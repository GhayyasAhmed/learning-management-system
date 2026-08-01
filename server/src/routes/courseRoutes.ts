import { Router } from "express";
import {
    addAnswer,
    addQuestion,
    addReview, addReviewReply,
    deleteCourse,
    editCourse,
    generateVideoUrl,
    getAllCourses,
    getAllCourseWithoutPurchase,
    getCourseByUser,
    getSingleCourseWithoutPurchase,
    uploadCourse
} from "../controllers/courseController.js";
import { updateAccessToken } from "../controllers/userController.js";
import { authorizeRoles, isAuthenticated } from "../middlewares/auth.js";
import {
    contentLimiter,
    publicApiLimiter,
    uploadLimiter,
    videoOtpLimiter,
} from "../middlewares/rateLimiter.js";

const courseRouter = Router()

courseRouter.post("/admin/create",updateAccessToken, isAuthenticated, authorizeRoles("admin"), uploadLimiter, uploadCourse)
courseRouter.patch("/admin/edit/:id",updateAccessToken, isAuthenticated, authorizeRoles("admin"), uploadLimiter, editCourse)
courseRouter.get("/all", publicApiLimiter, getAllCourseWithoutPurchase)
courseRouter.get("/get/:id", publicApiLimiter, getSingleCourseWithoutPurchase)
courseRouter.get("/get/user/:id",updateAccessToken, isAuthenticated, getCourseByUser)
courseRouter.put("/add-question",updateAccessToken, isAuthenticated, contentLimiter, addQuestion)
courseRouter.put("/add-answer",updateAccessToken, isAuthenticated, contentLimiter, addAnswer)
courseRouter.put("/add-review/:id",updateAccessToken, isAuthenticated, contentLimiter, addReview)
courseRouter.put("/admin/add-review-reply",updateAccessToken, isAuthenticated, authorizeRoles("admin"), contentLimiter, addReviewReply)
courseRouter.get("/admin/all",updateAccessToken, isAuthenticated, authorizeRoles("admin"), getAllCourses)
courseRouter.post("/getVdoCipherOTP", videoOtpLimiter, generateVideoUrl)
courseRouter.delete("/admin/delete",updateAccessToken, isAuthenticated, authorizeRoles("admin"), deleteCourse)
export default courseRouter
