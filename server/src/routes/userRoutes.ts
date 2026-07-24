import { Router } from "express";
import {
    activateUser,
    deleteUser,
    getAllUsers,
    getUserInfo, loginUser, logoutUser, registerUser,
    socialAuth,
    updateAccessToken,
    updateProfilePicture,
    updateUserInfo, updateUserPassword,
    updateUserRole
} from "../controllers/userController.js";
import { authorizeRoles, isAuthenticated } from "../middlewares/auth.js";

const userRouter = Router()

userRouter.post("/register", registerUser)
userRouter.post("/activate", activateUser)
userRouter.post("/login", loginUser)
userRouter.get("/logout",updateAccessToken, isAuthenticated, logoutUser)
userRouter.get("/refreshtoken", updateAccessToken)
userRouter.get("/me",updateAccessToken, isAuthenticated, getUserInfo)
userRouter.post("/social-auth", socialAuth)
userRouter.patch("/me/update",updateAccessToken, isAuthenticated, updateUserInfo)
userRouter.put("/password/update",updateAccessToken, isAuthenticated, updateUserPassword)
userRouter.put("/me/update/profile-picture",updateAccessToken, isAuthenticated, updateProfilePicture)
userRouter.get("/admin/all",updateAccessToken, isAuthenticated, authorizeRoles("admin"), getAllUsers)
userRouter.put("/admin/update-role",updateAccessToken, isAuthenticated, authorizeRoles("admin"), updateUserRole)
userRouter.delete("/admin/delete",updateAccessToken, isAuthenticated, authorizeRoles("admin"), deleteUser)
export default userRouter