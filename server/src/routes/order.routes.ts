import { Router } from "express";
import {
    createOrder,
    getAllOrders,
    newPayment,
    sendStripePublishableKey
} from "../controllers/order.controller.js";
import { updateAccessToken } from "../controllers/userController.js";
import { authorizeRoles, isAuthenticated } from "../middlewares/auth.js";

const orderRouter = Router()
orderRouter.post("/create",updateAccessToken, isAuthenticated, createOrder)
orderRouter.get("/admin/all",updateAccessToken, isAuthenticated, authorizeRoles("admin"), getAllOrders)
orderRouter.get('/payment/stripePublishAbleKey', sendStripePublishableKey);
// Use refresh-token flow so users with an expired access token can still pay
orderRouter.post('/payment/process', updateAccessToken, isAuthenticated, newPayment);
export default orderRouter