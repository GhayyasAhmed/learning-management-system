import { Router } from "express";
import { getCourseAnalytics, getOrderAnalytics, getUserAnalytics } from "../controllers/analytics.controllers.js";
import { updateAccessToken } from "../controllers/userController.js";
import { authorizeRoles, isAuthenticated } from "../middlewares/auth.js";


const analyticsRouter = Router()

analyticsRouter.get("/admin/user-analytics", updateAccessToken, isAuthenticated, authorizeRoles("admin"), getUserAnalytics)
analyticsRouter.get("/admin/course-analytics", updateAccessToken, isAuthenticated, authorizeRoles("admin"), getCourseAnalytics)
analyticsRouter.get("/admin/order-analytics", updateAccessToken, isAuthenticated, authorizeRoles("admin"), getOrderAnalytics)

export default analyticsRouter