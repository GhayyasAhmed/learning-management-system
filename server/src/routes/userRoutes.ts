import { Router } from "express";
import { activateUser, getUserInfo, loginUser, logoutUser, registerUser, updateAccessToken, socialAuth } from "../controllers/userController.js";
import { isAuthenticated } from "../middlewares/auth.js";


const userRouter = Router()

userRouter.post("/register", registerUser)
userRouter.post("/activate", activateUser)
userRouter.post("/login", loginUser)
userRouter.get("/logout", isAuthenticated, logoutUser)
userRouter.get("/refreshtoken", updateAccessToken)
userRouter.get("/me", isAuthenticated, getUserInfo)
userRouter.post("/social-auth", socialAuth)

export default userRouter