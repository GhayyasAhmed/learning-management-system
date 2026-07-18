import { Router } from "express";
import { uploadCourse, editCourse } from "../controllers/courseController.js";
import { authorizeRoles, isAuthenticated } from "../middlewares/auth.js";

const courseRouter = Router()

courseRouter.post("/create", isAuthenticated, authorizeRoles("admin"), uploadCourse)
courseRouter.patch("/edit/:id", isAuthenticated, authorizeRoles("admin"), editCourse)

export default courseRouter
