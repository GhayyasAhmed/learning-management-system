import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import { rateLimit } from "express-rate-limit";
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

// Body parser
app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());

// Rate Limiter Configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes in milliseconds
  limit: 100, // Limit each IP to 100 requests per 15-minute window
  standardHeaders: "draft-8", // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  ipv6Subnet: 56,
});

// Apply Rate Limiter globally to all requests
app.use(limiter);

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

// Production Health Check
app.get("/api/v1/health-check", (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;

  const systemStatus = isDbConnected ? "ok" : "degraded";
  const statusCode = isDbConnected ? 200 : 503;

  res.status(statusCode).json({
    status: systemStatus,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    services: {
      database: {
        status: isDbConnected ? "up" : "down",
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