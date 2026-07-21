import { Router } from "express";
import {
    activateUser, getUserInfo, loginUser, logoutUser, registerUser,
    updateAccessToken, socialAuth, updateUserInfo, updateUserPassword, updateProfilePicture,
    getAllUsers
} from "../controllers/userController.js";
import { authorizeRoles, isAuthenticated } from "../middlewares/auth.js";


const userRouter = Router()

userRouter.post("/register", registerUser)
userRouter.post("/activate", activateUser)
userRouter.post("/login", loginUser)
userRouter.get("/logout", isAuthenticated, logoutUser)
userRouter.get("/refreshtoken", updateAccessToken)
userRouter.get("/me", isAuthenticated, getUserInfo)
userRouter.post("/social-auth", socialAuth)
userRouter.patch("/me/update", isAuthenticated, updateUserInfo)
userRouter.put("/password/update", isAuthenticated, updateUserPassword)
userRouter.put("/me/update/profile-picture", isAuthenticated, updateProfilePicture)
userRouter.get("/admin/all", isAuthenticated, authorizeRoles("admin"), getAllUsers)

export default userRouter