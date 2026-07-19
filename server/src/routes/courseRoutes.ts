import { Router } from "express";
import {
    uploadCourse, editCourse, getSingleCourseWithoutPurchase, getAllCourseWithoutPurchase,
    getCourseByUser, addQuestion, addAnswer

} from "../controllers/courseController.js";
import { authorizeRoles, isAuthenticated } from "../middlewares/auth.js";

const courseRouter = Router()

courseRouter.post("/create", isAuthenticated, authorizeRoles("admin"), uploadCourse)
courseRouter.patch("/edit/:id", isAuthenticated, authorizeRoles("admin"), editCourse)
courseRouter.get("/get/all", getAllCourseWithoutPurchase)
courseRouter.get("/get/:id", getSingleCourseWithoutPurchase)
courseRouter.get("/get/user/:id", isAuthenticated, getCourseByUser)
courseRouter.put("/add-question", isAuthenticated, addQuestion)
courseRouter.put("/add-answer", isAuthenticated, addAnswer)
export default courseRouter
