import mongoose from "mongoose";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";

// Disable buffering globally so Mongoose immediately fails if not connected,
// rather than hanging for 10 seconds.
mongoose.set("bufferCommands", false);

let isConnected = false;

export async function connectDatabase() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  try {
    const db = await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: false,
    });

    isConnected = true;
    logger.info("mongo_connected");

     mongoose.connection.on("error", (err: any) => {
      logger.error("mongo_connection_error", { message: err?.message });
      isConnected = false;
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("mongo_disconnected");
      isConnected = false;
    });

    mongoose.connection.on("reconnected", () => {
      logger.info("mongo_reconnected");
      isConnected = true;
    });

    return db;
  } catch (error: any) {
    const message = typeof error?.message === "string"
      ? error.message.replace(/:\/\/[^@]+@/, "://****@")
      : "Unknown error";
    logger.error("mongo_connect_failed", { message });
    throw error;
  }
}