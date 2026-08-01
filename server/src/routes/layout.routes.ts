import { Router } from "express";
import { createLayout, editLayout, getLayoutByType } from "../controllers/layout.controllers.js";
import { updateAccessToken } from "../controllers/userController.js";
import { authorizeRoles, isAuthenticated } from "../middlewares/auth.js";
import { publicApiLimiter } from "../middlewares/rateLimiter.js";

const layoutRouter = Router()

layoutRouter.post("/admin/create",updateAccessToken, isAuthenticated, authorizeRoles("admin"), createLayout)
layoutRouter.put("/admin/edit",updateAccessToken, isAuthenticated, authorizeRoles("admin"), editLayout)
layoutRouter.get("/get/:type", publicApiLimiter, getLayoutByType)

export default layoutRouter