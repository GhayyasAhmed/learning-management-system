import { Router } from "express";
import { activateUser, registerUser } from "../controllers/userController.js";


const userRouter = Router()

userRouter.post("/register", registerUser)
userRouter.post("/activate", activateUser)

export default userRouter