import http from "http";
import mongoose from "mongoose";
import app from "./app.js";
import { connectDatabase } from "./config/database.js";
import { env } from "./config/env.js";
import { redis } from "./config/redis.js";
import { logger } from "./utils/logger.js";
import { initSocketServer } from "./socketServer.js";

const server = http.createServer(app);
initSocketServer(server);

logger.info("startup_begin", { port: env.port, nodeEnv: env.nodeEnv });

process.on("unhandledRejection", (reason: any) => {
  logger.error("unhandled_rejection", { message: reason?.message || String(reason) });
});

process.on("uncaughtException", (error: Error) => {
  logger.error("uncaught_exception", { message: error.message });
  process.exit(1);
});

let shuttingDown = false;

function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info("shutdown_begin", { signal });

  const forceExit = setTimeout(() => {
    logger.warn("shutdown_forced", { signal });
    process.exit(1);
  }, 10000);

  server.close(async () => {
    try {
      await mongoose.connection.close();
    } catch (error: any) {
      logger.warn("mongo_close_failed", { message: error?.message });
    }
    try {
      await redis.quit();
    } catch (error: any) {
      logger.warn("redis_close_failed", { message: error?.message });
    }
    clearTimeout(forceExit);
    logger.info("shutdown_complete", { signal });
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

async function startServer() {
  try {
    await connectDatabase();
    logger.info("db_connected");
    logger.info("integrations_status", {
      stripe: Boolean(process.env.STRIPE_SECRET_KEY),
      cloudinary: Boolean(process.env.CLOUDINARY_CLOUD_NAME),
      smtp: Boolean(process.env.SMTP_MAIL),
      vdocipher: Boolean(process.env.VDOCIPHER_API_SECRET),
    });

    server.listen(env.port, () => {
      logger.info("server_listening", { port: env.port });
    });
  } catch (error: any) {
    logger.error("startup_failed", { message: error?.message });
    process.exit(1);
  }
}

void startServer();