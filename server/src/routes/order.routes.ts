import { Router } from "express";
import {
    createOrder
} from "../controllers/order.controller.js";
import { isAuthenticated } from "../middlewares/auth.js";

const orderRouter = Router()
orderRouter.post("/create", isAuthenticated, createOrder)
export default orderRouter