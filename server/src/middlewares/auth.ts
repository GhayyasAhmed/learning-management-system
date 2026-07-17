import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { redis } from "../config/redis.js";
import ErrorHandler from "../utils/errorhandler.js";
import CatchAsyncError from "./catchAsyncError.js";


export const isAuthenticated = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const accessToken = req.cookies.accessToken || req.headers.authorization?.split(" ")[1]
    if(!accessToken){
        return next(new ErrorHandler("Please login to access this resource", 401))
    }

    const decodedData = jwt.verify(accessToken, process.env.ACCESS_TOKEN || "") as JwtPayload
    
    if(!decodedData){
        return next(new ErrorHandler("Invalid access token", 401))
    }

    const user = await redis.get(decodedData.id)

    if(!user){
        return next(new ErrorHandler("Session expired. Please login again", 401))
    }

    req.user = JSON.parse(user)
    next()

})