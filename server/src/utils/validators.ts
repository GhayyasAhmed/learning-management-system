import mongoose from "mongoose";

export const isValidObjectId = (id: unknown): id is string =>
    typeof id === "string" && mongoose.Types.ObjectId.isValid(id);

export const isNonEmptyString = (value: unknown): value is string =>
    typeof value === "string" && value.trim().length > 0;