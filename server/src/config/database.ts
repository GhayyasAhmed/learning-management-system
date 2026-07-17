import mongoose from "mongoose";
import { env } from "./env.js";

let cachedConnection: typeof mongoose | null = null;
let connectionPromise: Promise<typeof mongoose> | null = null;

export async function connectDatabase() {
  if (cachedConnection || mongoose.connection.readyState === 1) {
    return cachedConnection || mongoose;
  }

  if (connectionPromise) {
    cachedConnection = await connectionPromise;
    return cachedConnection;
  }

  connectionPromise = mongoose
    .connect(env.mongoUri, {
      serverSelectionTimeoutMS: 10000
    })
    .then((connection) => {
      cachedConnection = connection;
      return connection;
    })
    .finally(() => {
      connectionPromise = null;
    });

  cachedConnection = await connectionPromise;
  return cachedConnection;
}
