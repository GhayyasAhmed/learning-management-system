import "dotenv/config";
import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import type { StringValue } from "ms";
import { redis } from "../config/redis.js";
import catchAsyncError from "../middlewares/catchAsyncError.js";
import UserModel, { IUser } from "../models/user.model.js";
import ErrorHandler from "../utils/errorhandler.js";
import { sendToken } from "../utils/jwt.js";
import sendEmail from "../utils/sendEmail.js";
import { accessTokenOptions, refreshTokenOptions } from "../utils/jwt.js";
import cloudinary from "cloudinary";

// Use lowercase primitive types 'string' instead of uppercase 'String'
interface IRegistrationBody {
    name: string;
    email: string;
    password: string;
    avatar?: string;
}

export const registerUser = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, email, password } = req.body;

        // CRUCIAL: Use findOne so it returns null if the user does not exist
        const isEmailExist = await UserModel.findOne({ email });
        if (isEmailExist) {
            return next(new ErrorHandler("User already exists", 400));
        }

        const user: IRegistrationBody = {
            name,
            email,
            password
        };

        const activationToken = createActiviationToken(user);
        const { activationCode } = activationToken

        const data = { user: { name: user.name }, activationCode }
        // const html = await ejs.renderFile(path.join(import.meta.dirname, "../mails/activation-mail.ejs"), data)

        try {
            await sendEmail({
                email: user.email,
                subject: "Activate Your Account",
                template: "activation-mail.ejs",
                data
            })
            res.status(201).json({
                success: true,
                message: `Please check your email: ${user.email} to activate your account!`,
                activationToken: activationToken.token
            })
        }
        catch (error: any) {
            return next(new ErrorHandler(error.message, 400))

        }
    }
    catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

interface IActivationToken {
    token: string;
    activationCode: string;
}

const expiryTime = process.env.JWT_EXPIRE;

// Create a type guard or fallback to a known literal string
const finalExpiry = (expiryTime && typeof expiryTime === "string")
    ? (expiryTime as StringValue)
    : "5m";

export const createActiviationToken = (user: IRegistrationBody): IActivationToken => {
    const activationCode = Math.floor(1000 + Math.random() * 9000).toString();

    const token = jwt.sign(
        { user, activationCode },
        process.env.ACTIVATION_SECRET as Secret,
        {
            expiresIn: finalExpiry
        }
    );

    return { token, activationCode };
};


//activate user

interface IActivationRequest {
    activationToken: string;
    activationCode: string;
}


export const activateUser = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { activationToken, activationCode } = req.body as IActivationRequest;
        const newUser: { user: IUser; activationCode: string } = jwt.verify(
            activationToken,
            process.env.ACTIVATION_SECRET as string
        ) as { user: IUser; activationCode: string }

        if (newUser.activationCode !== activationCode) {
            return next(new ErrorHandler("Invalid activation code", 400))
        }

        const { name, email, password } = newUser.user

        const existUser = await UserModel.findOne({ email })

        if (existUser) {
            return next(new ErrorHandler("User already exists", 400))
        }

        const user = await UserModel.create({
            name,
            email,
            password
        })

        res.status(201).json({
            success: true,
            message: "User registered successfully"
        })

    }
    catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }

})



interface ILoginRequest {
    email: string;
    password: string;
}

export const loginUser = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {

        const { email, password } = req.body as ILoginRequest;

        if (!email || !password) {
            return next(new ErrorHandler("Please enter email & password", 400))
        }

        const user = await UserModel.findOne({ email }).select("+password")

        if (!user) {
            return next(new ErrorHandler("Invalid email or password", 401))
        }

        const isPasswordMatched = await user.comparePassword(password);
        if (!isPasswordMatched) {
            return next(new ErrorHandler("Invalid email or password", 401))
        }

        sendToken(user, 200, res, "Login successful")
    }
    catch (error: any) {
        return next(new ErrorHandler(error.message, 400))

    }

})

export const logoutUser = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        res.cookie("accessToken", null, { expires: new Date(Date.now()), httpOnly: true })
        res.cookie("refreshToken", null, { expires: new Date(Date.now()), httpOnly: true })

        redis.del(req.user?._id.toString() || "")

        res.status(200).json({ success: true, message: "Logged out successfully" })
    }
    catch (error: any) {
        return next(new ErrorHandler(error.message, 400))

    }
})


export const updateAccessToken = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const refreshToken = req.cookies.refreshToken as string;
        const decodedRefreshToken = jwt.verify(refreshToken, process.env.REFRESH_TOKEN as string) as JwtPayload;
        if (!decodedRefreshToken) {
            return next(new ErrorHandler("Invalid refresh token", 401));
        }
        const session = await redis.get(decodedRefreshToken.id as string);
        if (!session) {
            return next(new ErrorHandler("Session expired. Please log in again.", 401));
        }

        const user = JSON.parse(session) as IUser;

        const accessToken = jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN as string, { expiresIn: "5m" });

        const newRefreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN as string, { expiresIn: "59m" });

        req.user = user; // Update the user in the request object

        res.cookie("accessToken", accessToken, accessTokenOptions);
        res.cookie("refreshToken", newRefreshToken, refreshTokenOptions);

        await redis.set(user._id.toString(), JSON.stringify(user), "EX", parseInt(process.env.REFRESH_TOKEN_EXPIRE || "59", 10) * 60);
        res.status(200).json({ success: true, message: "Access token updated successfully", accessToken });
    }
    catch (error: any) {
        return next(new ErrorHandler(error.message, 400))
    }
})


export const getUserInfo = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        // get user info from redis cache without password
        const user = await redis.get(req.user?._id.toString() || "") as string | null;
        if (user) {
            const userData = JSON.parse(user);
            delete userData.password; // Remove password from the user object before sending the response
            return res.status(200).json({
                success: true,
                user: userData
            });
        }
    }
    catch (error: any) {
        return next(new ErrorHandler(error.message, 400))
    }
})


// social auth

interface ISocialAuthRequest {
    name: string;
    email: string;
    avatar: {
        public_id: string;
        url: string;
    };
}

export const socialAuth = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, email, avatar } = req.body as ISocialAuthRequest;
        const user = await UserModel.findOne({ email });
        if (!user) {
            const newUser = await UserModel.create({
                name,
                email,
                avatar
            })
            sendToken(newUser, 201, res, "User registered successfully")
        }
        else {
            sendToken(user, 200, res, "Login successful")
        }

    }
    catch (error: any) {
        return next(new ErrorHandler(error.message, 400))
    }
})

//update user info 
interface IUpdateUserInfoRequest {
    name?: string;
    email?: string;
    avatar?: {
        public_id: string;
        url: string;
    };
}


export const updateUserInfo = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, email, avatar } = req.body as IUpdateUserInfoRequest;
        const user = await UserModel.findById(req.user?._id);
        if (!user) {
            return next(new ErrorHandler("User not found", 404))
        }
        if (email) {
            const isEmailExist = await UserModel.findOne({ email });
            if (isEmailExist && isEmailExist._id.toString() !== user._id.toString()) {
                return next(new ErrorHandler("email already in use", 400));
            }
            user.email = email;
        }

        if (name) user.name = name;
        if (avatar) user.avatar = avatar;

        await user.save();

        await redis.set(user._id.toString(), JSON.stringify(user), "EX", parseInt(process.env.REFRESH_TOKEN_EXPIRE || "59", 10) * 60);

        res.status(200).json({
            success: true,
            message: "User info updated successfully",
            user
        })
    }
    catch (error: any) {
        return next(new ErrorHandler(error.message, 400))
    }
})


// update user password
interface IUpdatePasswordRequest {
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
}

export const updateUserPassword = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await UserModel.findById(req.user?._id).select("+password") as IUser | null;

        // for social auth users, password will be undefined, so we need to check for that
        if (user?.password === undefined) {
            return next(new ErrorHandler("Invalid user", 400))
        }

        const { oldPassword, newPassword, confirmPassword } = req.body as IUpdatePasswordRequest;
        const isPasswordMatched = await user?.comparePassword(oldPassword);
        if (!isPasswordMatched) {
            return next(new ErrorHandler("Old password is incorrect", 400))
        }

        if (newPassword !== confirmPassword) {
            return next(new ErrorHandler("New password and confirm password do not match", 400))
        }

        user.password = newPassword;
        await user.save();

        sendToken(user, 200, res, "Password updated successfully")

    }
    catch (error: any) {
        return next(new ErrorHandler(error.message, 400))
    }
})

interface IUpdateProfilePictureRequest {
    avatar: string
}


//update profile picture
export const updateProfilePicture = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { avatar } = req.body as IUpdateProfilePictureRequest;
        if (!avatar) {
            return next(new ErrorHandler("Please provide a profile picture", 400))
        }
        const user = await UserModel.findById(req.user?._id);
        if (!user) {
            return next(new ErrorHandler("User not found", 404))
        }

        if (user?.avatar?.public_id) {
            // delete the old profile picture from cloudinary
            await cloudinary.v2.uploader.destroy(user.avatar.public_id)
        }

        // upload the new profile picture to cloudinary
        const result = await cloudinary.v2.uploader.upload(avatar, {
            folder: "profile_pictures",
            width: 150,
            // crop: "scale"
        })

        user.avatar = {
            public_id: result.public_id,
            url: result.secure_url
        }

        await user.save();

        await redis.set(user._id.toString(), JSON.stringify(user), "EX", parseInt(process.env.REFRESH_TOKEN_EXPIRE || "59", 10) * 60);

        res.status(200).json({
            success: true,
            message: "Profile picture updated successfully",
            user
        })

    }
    catch (error: any) {
        return next(new ErrorHandler(error.message, 400))
    }
})


export const getAllUsers = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try{
        const users = await UserModel.find().sort({createdAt: -1})

        res.status(201).json({
            success:true,
            users
        })
    }catch (error: any) {
        return next(new ErrorHandler(error.message, 400))
    }

})