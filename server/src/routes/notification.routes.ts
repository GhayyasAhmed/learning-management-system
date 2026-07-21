import { Router } from "express";
import { getAllNotifications, updateNotificationStatus } from "../controllers/notfication.controller.js";
import { authorizeRoles, isAuthenticated } from "../middlewares/auth.js";


const notificationRouter = Router()
notificationRouter.get("/admin/all", isAuthenticated, authorizeRoles("admin"), getAllNotifications)
notificationRouter.patch("/admin/:id/status-update", isAuthenticated, authorizeRoles("admin"), updateNotificationStatus)
export default notificationRouter