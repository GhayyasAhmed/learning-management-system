import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import { env } from "./config/env.js";
import errorMiddleware from "./middlewares/error.js";
import courseRouter from "./routes/courseRoutes.js";
import notificationRouter from "./routes/notification.routes.js";
import orderRouter from "./routes/order.routes.js";
import userRouter from "./routes/userRoutes.js";
import analyticsRouter from "./routes/analytics.routes.js";
import layoutRouter from "./routes/layout.routes.js";
import { connectDatabase } from "./config/database.js";

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || env.allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS origin is not allowed"));
    },

    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  }),
);

// body parser
app.use(express.json({ limit: "50mb" }));

app.use(cookieParser());

// Database Connection Middleware
app.use(async (req, res, next) => {
  try {
    await connectDatabase();
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Database connection fail: Please check MONGO_URI string or network status.",
    });
  }
});

// Temporary Health Check & DB/ENV Diagnostic Route
app.get("/api/v1/health-check", (req, res) => {
  const dbStateMap: Record<number, string> = {
    0: "Disconnected",
    1: "Connected",
    2: "Connecting",
    3: "Disconnecting",
    99: "Uninitialized",
  };

  const currentDbState = mongoose.connection.readyState;

  // Safely mask MongoDB credentials for display
  const maskedMongoUri = env.mongoUri
    ? env.mongoUri.replace(/\/\/(.*):(.*)@/, "//***:***@")
    : "NOT_SET";

  res.status(200).json({
    success: true,
    timestamp: new Date().toISOString(),
    database: {
      status: dbStateMap[currentDbState] || "Unknown",
      readyStateCode: currentDbState,
      host: mongoose.connection.host || "N/A",
      dbName: mongoose.connection.name || "N/A",
    },
    environment: {
      nodeEnv: env.nodeEnv,
      port: env.port,
      mongoUriConfigured: Boolean(env.mongoUri),
      maskedMongoUri: maskedMongoUri,
      allowedOrigins: env.allowedOrigins,
      processEnvChecks: {
        NODE_ENV: process.env.NODE_ENV || "NOT_SET",
        MONGO_URI_EXISTS: Boolean(process.env.MONGO_URI),
        PORT_EXISTS: Boolean(process.env.PORT),
        CLOUD_NAME_EXISTS: Boolean(process.env.CLOUD_NAME),
      },
    },
  });
});

// API Routes
app.use("/api/v1/user", userRouter);
app.use("/api/v1/course", courseRouter);
app.use("/api/v1/order", orderRouter);
app.use("/api/v1/notification", notificationRouter);
app.use("/api/v1/analytic", analyticsRouter);
app.use("/api/v1/layout", layoutRouter);

app.get("/test", (req, res, next) => {
  res.status(200).json({
    success: true,
    message: "Backend in running",
  });
});

// Middleware for Errors
app.use(errorMiddleware);

export default app;