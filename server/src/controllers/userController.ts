import { Request, Response, NextFunction } from "express";
import UserModel, { IUser } from "../models/user.model.js";
import ErrorHandler from "../utils/errorhandler.js";
import catchAsyncError from "../middlewares/catchAsyncError.js";
import jwt, { Secret } from "jsonwebtoken";
import "dotenv/config";
import type { StringValue } from "ms"
import ejs from "ejs"
import path from "path";
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
        const {activationCode} = activationToken

        const data = {user: {name: user.name}, activationCode}
        // const html = await ejs.renderFile(path.join(import.meta.dirname, "../mails/activation-mail.ejs"), data)

        try{
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
        catch(error:any){
            return next(new ErrorHandler(error.message,400))
            
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

interface IActivationRequest{
    activationToken: string;
    activationCode: string;
}


export const activateUser = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {activationToken, activationCode} = req.body as IActivationRequest;
        const newUser: {user: IUser; activationCode:string} = jwt.verify(
            activationToken,
            process.env.ACTIVATION_SECRET as string
        ) as {user: IUser; activationCode:string}

        if(newUser.activationCode !== activationCode){
            return next(new ErrorHandler("Invalid activation code", 400))
        }
        
        const {name, email, password} = newUser.user

        const existUser = await UserModel.findOne({email})

        if(existUser){
            return next(new ErrorHandler("User already exists", 400))
        }

        const user = await UserModel.create({
            name,
            email,
            password
        })

        res.status(201).json({
            success:true,
            message: "User registered successfully"
        })

    }
    catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }

})