import "dotenv/config";
import { NextFunction, Request, Response } from "express";
import cron from 'node-cron';
import catchAsyncError from "../middlewares/catchAsyncError.js";
import NotificationModel from "../models/notification.models.js";
import ErrorHandler from "../utils/errorhandler.js";
import { isValidObjectId } from "../utils/validators.js";
import { logger } from "../utils/logger.js";


export const getAllNotifications = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const pageRaw = parseInt(req.query.page as string, 10);
        const limitRaw = parseInt(req.query.limit as string, 10);
        const statusRaw = (req.query.status as string) || "all";

        const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
        const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 20) : 20;
        const validStatuses = ["all", "read", "unread"];
        const status = validStatuses.includes(statusRaw) ? statusRaw : "all";

        const query: Record<string, unknown> = {};
        if (status !== "all") {
            query.status = status;
        }

        const [notifications, total, unreadCount] = await Promise.all([
            NotificationModel.find(query)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit),
                // .lean(),
            NotificationModel.countDocuments(query),
            NotificationModel.countDocuments({ status: "unread" }),
        ]);

        res.status(200).json({
            success: true,
            notifications,
            unreadCount,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.max(1, Math.ceil(total / limit)),
            },
        });
    }
    catch (error: any) {
        return next(new ErrorHandler(error.message, 400))
    }
})

export const markAllNotificationsRead = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Admin-facing notification inbox is shared (gated by authorizeRoles("admin"),
        // same as every other notification route) — not per-user, so this is a global
        // bulk update, matching existing getAllNotifications/updateNotificationStatus semantics.
        await NotificationModel.updateMany({ status: "unread" }, { $set: { status: "read" } });

        res.status(200).json({
            success: true,
            message: "All notifications marked as read",
        });
    }
    catch (error: any) {
        return next(new ErrorHandler(error.message, 400))
    }
})

interface INotificationStatusUpdateRequest{
    status: string;
}

export const updateNotificationStatus = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = req.params.id;
        if (!isValidObjectId(id)) {
            return next(new ErrorHandler("Invalid notification id", 400))
        }

        const notification = await NotificationModel.findById(id)
        if(!notification){
            return next(new ErrorHandler("Invalid notification id", 404))
        }

        const {status} = req.body as INotificationStatusUpdateRequest
        
        if (!["read", "unread"].includes(status)) {
            return next(new ErrorHandler("Invalid status value", 400))
        }
        
        notification.status = status
        await notification.save()

        const notifications = await NotificationModel.find().sort({ createdAt: -1 })

        res.status(200).json({
            success: true,
            message: "notification status updated successfully",
            notifications
        })
    }
    catch (error: any) {
        return next(new ErrorHandler(error.message, 400))
    }
})

// delete notification more than 30 days old


cron.schedule('0 0 0 * * *',  async () => {
    logger.info("notification_cleanup_started");
    try {
        const thirtyDaysAgo = new Date(Date.now() - 30 *24*60*60*1000)
        const result = await NotificationModel.deleteMany({status: "read", createdAt: {$lt: thirtyDaysAgo}})
        logger.info("notification_cleanup_completed", { deletedCount: result.deletedCount });
    } catch (error: any) {
        logger.error("notification_cleanup_failed", { message: error?.message });
    }
});

