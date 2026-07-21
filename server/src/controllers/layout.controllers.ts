import "dotenv/config";
import { NextFunction, Response, Request } from "express";
import catchAsyncError from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../utils/errorhandler.js";
import cloudinary from "cloudinary"
import LayoutModel from "../models/layout.model.js";

export const createLayout = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const type = req.body?.type?.toLowerCase();
        // Prevent duplicate layout types from being created
        const isTypeExist = await LayoutModel.findOne({ type });
        if (isTypeExist) {
            return next(new ErrorHandler(`${type} layout already exists`, 400));
        }

        if (type?.toLowerCase() === "banner") {
            const { image, title, subTitle } = req.body;
            const myCloud = await cloudinary.v2.uploader.upload(image, {
                folder: "layout"
            });

            const banner = {
                image: {
                    public_id: myCloud.public_id,
                    url: myCloud.secure_url
                },
                title,
                subTitle
            };

            await LayoutModel.create({ type: "banner", banner });
        }

        if (type?.toLowerCase() === "faq") {
            const { faq } = req.body;
            await LayoutModel.create({ type: "faq", faq });
        }

        if (type?.toLowerCase() === "categories") {
            const { categories } = req.body; // 👈 Fixed spelling mistake here
            await LayoutModel.create({ type: "categories", categories });
        }

        res.status(201).json({
            success: true,
            message: "Layout created successfully"
        });

    }
    catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});