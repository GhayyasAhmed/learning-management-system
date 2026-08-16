import {v2 as cloudinary} from "cloudinary"
import { logger } from "../utils/logger.js"


const connectCloudinary = async () => {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    })

    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
        logger.warn("cloudinary_not_configured");
    } else {
        logger.info("cloudinary_configured");
    }
}


export default connectCloudinary