import { Router } from "express";
import {
    createOrder,
    getAllOrders
} from "../controllers/order.controller.js";
import { updateAccessToken } from "../controllers/userController.js";
import { authorizeRoles, isAuthenticated } from "../middlewares/auth.js";

const orderRouter = Router()
orderRouter.post("/create",updateAccessToken, isAuthenticated, createOrder)
orderRouter.get("/admin/all",updateAccessToken, isAuthenticated, authorizeRoles("admin"), getAllOrders)
export default orderRouter