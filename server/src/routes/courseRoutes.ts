import { Router } from "express";
import {
    addAnswer,
    addQuestion,
    addReview, addReviewReply,
    editCourse,
    getAllCourses,
    getAllCourseWithoutPurchase,
    getCourseByUser,
    getSingleCourseWithoutPurchase,
    uploadCourse
} from "../controllers/courseController.js";
import { authorizeRoles, isAuthenticated } from "../middlewares/auth.js";

const courseRouter = Router()

courseRouter.post("/admin/create", isAuthenticated, authorizeRoles("admin"), uploadCourse)
courseRouter.patch("/admin/edit/:id", isAuthenticated, authorizeRoles("admin"), editCourse)
courseRouter.get("/all", getAllCourseWithoutPurchase)
courseRouter.get("/get/:id", getSingleCourseWithoutPurchase)
courseRouter.get("/get/user/:id", isAuthenticated, getCourseByUser)
courseRouter.put("/add-question", isAuthenticated, addQuestion)
courseRouter.put("/add-answer", isAuthenticated, addAnswer)
courseRouter.put("/add-review/:id", isAuthenticated, addReview)
courseRouter.put("/admin/add-review-reply", isAuthenticated, authorizeRoles("admin"), addReviewReply)
courseRouter.get("/admin/all", isAuthenticated, authorizeRoles("admin"), getAllCourses)
export default courseRouter
