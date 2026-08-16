import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/errorhandler.js";
import { logger } from "../utils/logger.js";

const errorMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
    err.statusCode = err.statusCode || 500;
    err.message = err.message || "Internal Server Error"

    // mongodb cast error

    if (err.name === "CastError") {
        const message = `Resource not found. Invalid: ${err.path}`
        err = new ErrorHandler(message, 400)
    }

    // mongoose duplicate key error

    if (err.code === 11000) {
        const message = `Duplicate ${Object.keys(err.keyValue)} entered`
        err = new ErrorHandler(message, 400)
    }

    // wrong jwt token
    if (err.name === "JsonWebTokenError") {
        const message = `JSON web token is invalid, Try again`
        err = new ErrorHandler(message, 400)
    }

    // jwt token expire
    if (err.name === "TokenExpiredError") {
        const message = `JSON web token is expired, Try again`
        err = new ErrorHandler(message, 400)
    }

    const isOperational = err.isOperational === true;

    if (err.statusCode >= 500 || !isOperational) {
        logger.error("request_failed", {
            requestId: req.id,
            method: req.method,
            path: req.originalUrl,
            statusCode: err.statusCode,
            message: err.message,
        });
    } else {
        logger.warn("request_rejected", {
            requestId: req.id,
            method: req.method,
            path: req.originalUrl,
            statusCode: err.statusCode,
            message: err.message,
        });
    }

    const responseMessage =
        !isOperational && err.statusCode >= 500
            ? "Something went wrong. Please try again later."
            : err.message;

    res.status(err.statusCode).json({
        success: false,
        message: responseMessage
    })
}

export default errorMiddleware