import { Router } from "express";
import {
    createOrder,
    getAllOrders
} from "../controllers/order.controller.js";
import { authorizeRoles, isAuthenticated } from "../middlewares/auth.js";

const orderRouter = Router()
orderRouter.post("/create", isAuthenticated, createOrder)
orderRouter.get("/admin/all", isAuthenticated, authorizeRoles("admin"), getAllOrders)
export default orderRouter