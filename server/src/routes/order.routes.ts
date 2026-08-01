import { Router } from "express";
import {
    createOrder,
    getAllOrders,
    newPayment,
    sendStripePublishableKey
} from "../controllers/order.controller.js";
import { updateAccessToken } from "../controllers/userController.js";
import { authorizeRoles, isAuthenticated } from "../middlewares/auth.js";
import { paymentLimiter, publicApiLimiter } from "../middlewares/rateLimiter.js";

const orderRouter = Router()
orderRouter.post("/create",updateAccessToken, isAuthenticated, paymentLimiter, createOrder)
orderRouter.get("/admin/all",updateAccessToken, isAuthenticated, authorizeRoles("admin"), getAllOrders)
orderRouter.get('/payment/stripePublishAbleKey', publicApiLimiter, sendStripePublishableKey);
// Use refresh-token flow so users with an expired access token can still pay
orderRouter.post('/payment/process', updateAccessToken, isAuthenticated, paymentLimiter, newPayment);
export default orderRouter