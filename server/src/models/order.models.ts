import "dotenv/config";
import mongoose, { Document, Model, Schema } from "mongoose";

export interface IOrder extends Document {
    userId: mongoose.Types.ObjectId;
    courseId: mongoose.Types.ObjectId;
    paymentInfo: object;
}


const orderSchema: Schema<IOrder> = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: true
    },
    paymentInfo: {
        type: Object
    }
}, {timestamps: true})

const OrderModel: Model<IOrder>= mongoose.model("Order", orderSchema)

export default OrderModel;


