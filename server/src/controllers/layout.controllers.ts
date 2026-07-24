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
            const { categories } = req.body;
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


export const editLayout = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const type = req.body?.type?.toLowerCase();
        if (!type) {
            return next(new ErrorHandler("Layout type is required", 400));
        }
        const oldLayout: any = await LayoutModel.findOne({
            type: { $regex: new RegExp(`^${type}$`, "i") }
        });
        if (!oldLayout) {
            return next(new ErrorHandler(`Layout for ${type} does not exists`, 404));
        }

        if (type?.toLowerCase() === "banner") {
            const { image, title, subTitle } = req.body;

            let bannerDataImage = oldLayout.banner?.image;

            // Only upload to Cloudinary if a NEW image (base64 string) is provided
            if (image && !image.startsWith("http")) {
                // 1. Destroy old image from Cloudinary if public_id exists
                if (oldLayout.banner?.image?.public_id) {
                    await cloudinary.v2.uploader.destroy(oldLayout.banner.image.public_id);
                }

                // 2. Upload new base64 image
                const myCloud = await cloudinary.v2.uploader.upload(image, {
                    folder: "layout"
                });

                bannerDataImage = {
                    public_id: myCloud?.public_id,
                    url: myCloud?.secure_url
                };
            }

            const banner = {
                image: bannerDataImage,
                title: title || oldLayout.banner?.title,
                subTitle: subTitle || oldLayout.banner?.subTitle
            };

            await LayoutModel.findByIdAndUpdate(
                oldLayout._id,
                { banner },
                { returnDocument: 'after', runValidators: true }
            );
        }

        if (type === "faq") {
            const { faq } = req.body;
            await LayoutModel.findByIdAndUpdate(
                oldLayout._id,
                { faq },
                { returnDocument: 'after', runValidators: true }
            );
        }

        if (type === "categories") {
            const { categories } = req.body;
            await LayoutModel.findByIdAndUpdate(
                oldLayout._id,
                { categories },
                { returnDocument: 'after', runValidators: true }
            );
        }

        res.status(201).json({
            success: true,
            message: "Layout updated successfully"
        });

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});


export const getLayoutByType = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { type } = req?.params
        const layout = await LayoutModel.findOne({
            type: { $regex: new RegExp(`^${type}$`, "i") }
        });

        res.status(200).json({
            success: true,
            layout
        })
    }
    catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
})

