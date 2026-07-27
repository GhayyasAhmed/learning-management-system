import "dotenv/config";
import mongoose, { Document, Model, Schema } from "mongoose";

export interface INotification extends Document {
    title: string;
    message: string;
    status: string;
    userId: mongoose.Types.ObjectId;
    type?: string;
    courseId?: string;
    contentId?: string;
    questionId?: string;
    reviewId?: string;
}

const notificationSchema: Schema<INotification> = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, required: true, default: "unread" },
    type: { type: String },
    courseId: { type: String },
    contentId: { type: String },
    questionId: { type: String },
    reviewId: { type: String },
}, { timestamps: true })

const NotificationModel: Model<INotification> = mongoose.model("Notification", notificationSchema)

export default NotificationModel;


