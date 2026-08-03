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
    updateUserRole,
    refreshTokenHandler 
} from "../controllers/userController.js";
import { authorizeRoles, isAuthenticated } from "../middlewares/auth.js";
import {
    authLimiter,
    passwordLimiter,
    strictAuthLimiter,
    uploadLimiter,
} from "../middlewares/rateLimiter.js";

const userRouter = Router()

userRouter.post("/register", strictAuthLimiter, registerUser)
userRouter.post("/activate", strictAuthLimiter, activateUser)
userRouter.post("/login", strictAuthLimiter, loginUser)
userRouter.get("/logout",updateAccessToken, isAuthenticated, logoutUser)
// userRouter.get("/refreshtoken", authLimiter, updateAccessToken)
userRouter.get("/refreshtoken", authLimiter, updateAccessToken, refreshTokenHandler)
userRouter.get("/me",updateAccessToken, isAuthenticated, getUserInfo)
userRouter.post("/social-auth", strictAuthLimiter, socialAuth)
userRouter.patch("/me/update",updateAccessToken, isAuthenticated, updateUserInfo)
userRouter.put("/password/update",updateAccessToken, isAuthenticated, passwordLimiter, updateUserPassword)
userRouter.put("/me/update/profile-picture",updateAccessToken, isAuthenticated, uploadLimiter, updateProfilePicture)
userRouter.get("/admin/all",updateAccessToken, isAuthenticated, authorizeRoles("admin"), getAllUsers)
userRouter.put("/admin/update-role",updateAccessToken, isAuthenticated, authorizeRoles("admin"), updateUserRole)
userRouter.delete("/admin/delete",updateAccessToken, isAuthenticated, authorizeRoles("admin"), deleteUser)
export default userRouter