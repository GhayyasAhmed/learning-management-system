import axios from "axios";
import cloudinary from "cloudinary";
import crypto from "crypto";
import "dotenv/config";
import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { env } from "../config/env.js";
import { redis } from "../config/redis.js";
import catchAsyncError from "../middlewares/catchAsyncError.js";
import UserModel, { IUser, emailRegexPattern } from "../models/user.model.js";
import ErrorHandler from "../utils/errorhandler.js";
import { accessTokenOptions, refreshTokenOptions, sendToken } from "../utils/jwt.js";
import { isNonEmptyString, isValidObjectId } from "../utils/validators.js";
import sendEmail from "../utils/sendEmail.js";

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

        if (!isNonEmptyString(name) || name.trim().length < 2) {
            return next(new ErrorHandler("Please enter a valid name", 400));
        }

        if (!isNonEmptyString(email) || !emailRegexPattern.test(email)) {
            return next(new ErrorHandler("Please enter a valid email", 400));
        }

        if (!isNonEmptyString(password) || password.length < 8) {
            return next(new ErrorHandler("Password must be at least 8 characters", 400));
        }

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

        const activationToken = await createActiviationToken(user);
        const { activationCode } = activationToken
        const expirationTime = process.env.JWT_EXPIRE || "5";
        const data = { user: { name: user.name }, activationCode, expirationTime }
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

const expiryTime = process.env.JWT_EXPIRE + "m";

// Create a type guard or fallback to a known literal string
const finalExpiry = (expiryTime && typeof expiryTime === "string")
    ? (expiryTime as import("ms").StringValue)
    : "5m";

// Generates the activation code and a signed activation token.
//
// The token handed back to the client contains ONLY an opaque, random
// registration id (`regId`) — never the user's name/email/password, and
// never the plaintext activation code. The actual pending-registration data
// (including the password, in the same plaintext shape UserModel.create
// already expects, so its existing pre("save") bcrypt hook hashes it
// exactly as before) and a hash of the activation code are stored
// server-side in Redis, keyed by that id, with a TTL matching the token's
// own expiry window. This means decoding the JWT (trivial for anyone, since
// JWTs are signed, not encrypted) reveals nothing usable: no password, and
// no way to derive the activation code needed to actually activate the
// account.
export const createActiviationToken = async (user: IRegistrationBody): Promise<IActivationToken> => {
    // crypto.randomInt is a CSPRNG-backed generator, unlike Math.random().
    const activationCode = crypto.randomInt(1000, 10000).toString();
    const regId = crypto.randomBytes(16).toString("hex");
    const activationCodeHash = crypto.createHash("sha256").update(activationCode).digest("hex");

    const expireMinutes = parseInt(process.env.JWT_EXPIRE || "5", 10);
    await redis.set(
        `activation:${regId}`,
        JSON.stringify({ user, activationCodeHash }),
        "EX",
        Math.max(expireMinutes, 1) * 60
    );

    const token = jwt.sign(
        { regId },
        env.activationSecret,
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

        if (!activationToken || !activationCode) {
            return next(new ErrorHandler("Activation token and code are required", 400));
        }

        let decoded: { regId: string };
        try {
            decoded = jwt.verify(
                activationToken,
                env.activationSecret
            ) as { regId: string };
        } catch {
            return next(new ErrorHandler("Invalid or expired activation request. Please register again.", 400));
        }

        const pendingKey = `activation:${decoded.regId}`;
        const pending = await redis.get(pendingKey);
        if (!pending) {
            // Either already used (the key is deleted on successful
            // activation below, preventing replay of the same code) or
            // expired via its Redis TTL.
            return next(new ErrorHandler("Invalid or expired activation request. Please register again.", 400));
        }

        const { user: pendingUser, activationCodeHash } = JSON.parse(pending) as {
            user: IRegistrationBody;
            activationCodeHash: string;
        };

        const submittedCodeHash = crypto.createHash("sha256").update(activationCode).digest("hex");
        const submittedBuf = Buffer.from(submittedCodeHash);
        const storedBuf = Buffer.from(activationCodeHash);
        const codeMatches =
            submittedBuf.length === storedBuf.length &&
            crypto.timingSafeEqual(submittedBuf, storedBuf);

        if (!codeMatches) {
            return next(new ErrorHandler("Invalid activation code", 400))
        }

        // One-time use: remove the pending registration immediately so this
        // token/code pair can never be replayed, even if it hasn't expired.
        await redis.del(pendingKey);

        const { name, email, password } = pendingUser

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

        await sendToken(user, 200, res, "Login successful")
    }
    catch (error: any) {
        return next(new ErrorHandler(error.message, 400))

    }

})

export const logoutUser = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        res.cookie("accessToken", null, { expires: new Date(Date.now()), httpOnly: true })
        res.cookie("refreshToken", null, { expires: new Date(Date.now()), httpOnly: true })

        await redis.del(req.user?._id.toString() || "")

        res.status(200).json({ success: true, message: "Logged out successfully" })
    }
    catch (error: any) {
        return next(new ErrorHandler(error.message, 400))

    }
})


export const updateAccessToken = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const refreshToken = req.cookies.refreshToken as string;
        const decodedRefreshToken = jwt.verify(refreshToken, env.refreshTokenSecret) as JwtPayload;

        if (!decodedRefreshToken) {
            return next(new ErrorHandler("Invalid refresh token", 401));
        }

        const session = await redis.get(decodedRefreshToken.id as string);
        if (!session) {
            return next(new ErrorHandler("Session expired. Please log in again.", 401));
        }

        const user = JSON.parse(session) as IUser;

        // Updated lifetimes: 2 hours for Access Token, 24 hours for Refresh Token
        const accessToken = jwt.sign({ id: user._id }, env.accessTokenSecret, { expiresIn: "2h" });
        const newRefreshToken = jwt.sign({ id: user._id }, env.refreshTokenSecret, { expiresIn: "24h" });

        req.user = user;

        res.locals.user = user;
        res.locals.accessToken = accessToken;

        res.cookie("accessToken", accessToken, accessTokenOptions);
        res.cookie("refreshToken", newRefreshToken, refreshTokenOptions);

        // Update Redis TTL to match 24 hours in seconds (24 * 60 * 60)
        const refreshTokenExpireInSeconds = parseInt(process.env.REFRESH_TOKEN_EXPIRE || "24", 10) * 60 * 60;
        await redis.set(user._id.toString(), JSON.stringify(user), "EX", refreshTokenExpireInSeconds);

        next();
    }
    catch (error: any) {
        return next(new ErrorHandler(error.message, 401));
    }
});


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
            return next(new ErrorHandler("User session not found. Please login again.", 401));
        }
    }
    catch (error: any) {
        return next(new ErrorHandler(error.message, 400))
    }
})


// social auth

interface ISocialAuthRequest {
    name?: string;
    email?: string;
    avatar?: string;
    accessToken: string;
    provider: "google" | "github";
}

interface IVerifiedSocialIdentity {
    email: string;
    name?: string;
    avatar?: string;
}

// Verifies the supplied OAuth access token directly against the provider's
// own API and returns the identity the PROVIDER attests to. The email used
// for account lookup/creation must always come from this verified response
// — never from client-supplied request-body fields — so that a request can
// only ever authenticate as the Google/GitHub identity that actually issued
// the access token.
const verifySocialIdentity = async (
    provider: string,
    accessToken: string
): Promise<IVerifiedSocialIdentity | null> => {
    try {
        if (provider === "google") {
            const { data } = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            if (!data?.email || data?.email_verified !== true) {
                return null;
            }

            return { email: data.email, name: data.name, avatar: data.picture };
        }

        if (provider === "github") {
            const { data } = await axios.get("https://api.github.com/user", {
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            let email: string | undefined = data?.email || undefined;

            if (!email) {
                const { data: emails } = await axios.get("https://api.github.com/user/emails", {
                    headers: { Authorization: `Bearer ${accessToken}` },
                });
                const primary = Array.isArray(emails)
                    ? emails.find((e: any) => e.primary && e.verified)
                    : null;
                email = primary?.email;
            }

            if (!email) {
                return null;
            }

            return { email, name: data?.name || data?.login, avatar: data?.avatar_url };
        }

        return null;
    } catch (error: any) {
        console.error(`Social identity verification failed for ${provider}:`, error?.message);
        return null;
    }
};

export const socialAuth = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { avatar, accessToken, provider } = req.body as ISocialAuthRequest;

        if (!accessToken || !provider) {
            return next(new ErrorHandler("Missing social authentication credentials", 400));
        }

        // Independently verify the identity with the provider. This is the
        // control that prevents account takeover: the request body's email
        // is never trusted for lookup/creation below.
        const verifiedIdentity = await verifySocialIdentity(provider, accessToken);
        if (!verifiedIdentity?.email) {
            return next(new ErrorHandler("Could not verify social account. Please try again.", 401));
        }

        const email = verifiedIdentity.email;
        const name = verifiedIdentity.name || req.body.name || "";
        const resolvedAvatar = verifiedIdentity.avatar || avatar;

        const user = await UserModel.findOne({ email });
        if (!user) {
            let avatarData = { public_id: "", url: "" };

            // If a social avatar URL exists, upload it directly to Cloudinary
            if (resolvedAvatar) {
                const cloudResult = await cloudinary.v2.uploader.upload(resolvedAvatar, {
                    folder: "profile_pictures",
                    width: 150,
                });

                avatarData = {
                    public_id: cloudResult.public_id,
                    url: cloudResult.secure_url,
                };
            }

            const newUser = await UserModel.create({
                name,
                email,
                avatar: avatarData,
                isVerified: true,
            });

            await sendToken(newUser, 201, res, "User registered successfully");
        }
        else {
            await sendToken(user, 200, res, "Login successful")
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

        await sendToken(user, 200, res, "Password updated successfully")

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
    try {
        const users = await UserModel.find().sort({ createdAt: -1 })

        res.status(201).json({
            success: true,
            users
        })
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400))
    }

})


export const updateUserRole = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { role, userId } = req.body;

        if (!isValidObjectId(userId)) {
            return next(new ErrorHandler("Invalid user id", 400));
        }

        if (!["user", "admin"].includes(role)) {
            return next(new ErrorHandler("Invalid role value", 400));
        }

        const user = await UserModel.findById(userId)
        if (!user) {
            return next(new ErrorHandler("User not found", 404))
        }
        user.role = role
        await user.save()

        res.status(200).json({
            success: true,
            message: "User role updated successfully",
            user
        })
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400))
    }
})


export const deleteUser = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId } = req.body

        if (!isValidObjectId(userId)) {
            return next(new ErrorHandler("Invalid user id", 400));
        }

        const user = await UserModel.findById(userId)
        if (!user) {
            return next(new ErrorHandler("User not found", 404))
        }

        await user.deleteOne({ userId })
        await redis.del(userId)

        res.status(200).json({
            success: true,
            message: "User deleted successfully",
        })

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400))
    }
})