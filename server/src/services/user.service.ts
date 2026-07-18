import UserModel from "../models/user.model.js";
import { Response } from "express";


// get user by id
export const getUserById = async (id:string, res:Response) => {
    const user = await UserModel.findById(id)
    return res.status(200).json({
        success: true,
        user
    })

}