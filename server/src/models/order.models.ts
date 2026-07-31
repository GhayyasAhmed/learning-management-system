import "dotenv/config";
import mongoose, { Document, Model, Schema } from "mongoose";

export interface IOrder extends Document {
    userId: mongoose.Types.ObjectId;
    courseId: mongoose.Types.ObjectId;
    paymentInfo: object;
    paymentIntentId?: string;
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
    },
    // Identifies the Stripe PaymentIntent this order was fulfilled from.
    // sparse+unique so duplicate webhook deliveries / a race between the
    // client-confirmed path and the webhook cannot create two order
    // records for the same payment, while older documents without this
    // field remain valid (sparse index ignores missing values).
    paymentIntentId: {
        type: String,
        unique: true,
        sparse: true
    }
}, {timestamps: true})

const OrderModel: Model<IOrder>= mongoose.model("Order", orderSchema)

export default OrderModel;