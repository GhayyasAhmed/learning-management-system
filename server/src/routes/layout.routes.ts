import { Router } from "express";
import { createLayout, editLayout, getLayoutByType } from "../controllers/layout.controllers.js";
import { authorizeRoles, isAuthenticated } from "../middlewares/auth.js";


const layoutRouter = Router()

layoutRouter.post("/admin/create", isAuthenticated, authorizeRoles("admin"), createLayout)
layoutRouter.put("/admin/edit", isAuthenticated, authorizeRoles("admin"), editLayout)
layoutRouter.get("/get/:type", getLayoutByType)

export default layoutRouter