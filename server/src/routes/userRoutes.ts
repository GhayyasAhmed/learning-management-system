import { Router } from "express";
import { activateUser, registerUser, loginUser, logoutUser } from "../controllers/userController.js";
import { isAuthenticated } from "../middlewares/auth.js";


const userRouter = Router()

userRouter.post("/register", registerUser)
userRouter.post("/activate", activateUser)
userRouter.post("/login", loginUser)
userRouter.get("/logout", isAuthenticated, logoutUser)

export default userRouter