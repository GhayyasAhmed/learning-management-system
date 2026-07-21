import { Router } from "express";
import { getUserAnalytics, getCourseAnalytics, getOrderAnalytics } from "../controllers/analytics.controllers.js";
import { authorizeRoles, isAuthenticated } from "../middlewares/auth.js";


const analyticsRouter = Router()

analyticsRouter.get("/admin/user-analytics", isAuthenticated, authorizeRoles("admin"), getUserAnalytics)
analyticsRouter.get("/admin/course-analytics", isAuthenticated, authorizeRoles("admin"), getCourseAnalytics)
analyticsRouter.get("/admin/order-analytics", isAuthenticated, authorizeRoles("admin"), getOrderAnalytics)

export default analyticsRouter