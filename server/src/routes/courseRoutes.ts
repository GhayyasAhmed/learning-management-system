import { Router } from "express";
import { uploadCourse } from "../controllers/courseController.js";
import { authorizeRoles, isAuthenticated } from "../middlewares/auth.js";

const courseRouter = Router()

courseRouter.post("/create", isAuthenticated, authorizeRoles("admin"), uploadCourse)

export default courseRouter
