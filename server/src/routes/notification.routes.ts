import { Router } from "express";
import { getAllNotifications, markAllNotificationsRead, updateNotificationStatus } from "../controllers/notfication.controller.js";
import { updateAccessToken } from "../controllers/userController.js";
import { authorizeRoles, isAuthenticated } from "../middlewares/auth.js";

const notificationRouter = Router()
notificationRouter.get("/admin/all",updateAccessToken, isAuthenticated, authorizeRoles("admin"), getAllNotifications)
notificationRouter.patch("/admin/mark-all-read",updateAccessToken, isAuthenticated, authorizeRoles("admin"), markAllNotificationsRead)
notificationRouter.patch("/admin/:id/status-update",updateAccessToken, isAuthenticated, authorizeRoles("admin"), updateNotificationStatus)
export default notificationRouter