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

const courseRouter = Router()

courseRouter.post("/admin/create",updateAccessToken, isAuthenticated, authorizeRoles("admin"), uploadCourse)
courseRouter.patch("/admin/edit/:id",updateAccessToken, isAuthenticated, authorizeRoles("admin"), editCourse)
courseRouter.get("/all", getAllCourseWithoutPurchase)
courseRouter.get("/get/:id", getSingleCourseWithoutPurchase)
courseRouter.get("/get/user/:id",updateAccessToken, isAuthenticated, getCourseByUser)
courseRouter.put("/add-question",updateAccessToken, isAuthenticated, addQuestion)
courseRouter.put("/add-answer",updateAccessToken, isAuthenticated, addAnswer)
courseRouter.put("/add-review/:id",updateAccessToken, isAuthenticated, addReview)
courseRouter.put("/admin/add-review-reply",updateAccessToken, isAuthenticated, authorizeRoles("admin"), addReviewReply)
courseRouter.get("/admin/all",updateAccessToken, isAuthenticated, authorizeRoles("admin"), getAllCourses)
courseRouter.post("/getVdoCipherOTP", generateVideoUrl)
courseRouter.delete("/admin/delete",updateAccessToken, isAuthenticated, authorizeRoles("admin"), deleteCourse)
export default courseRouter
