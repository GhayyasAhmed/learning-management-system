import { Router } from "express";
import { createLayout } from "../controllers/layout.controllers.js";
import { authorizeRoles, isAuthenticated } from "../middlewares/auth.js";


const layoutRouter = Router()

layoutRouter.post("/admin/create", isAuthenticated, authorizeRoles("admin"), createLayout)

export default layoutRouter