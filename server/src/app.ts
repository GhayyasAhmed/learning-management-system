import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import connectCloudinary from "./config/cloudinary.js";
import { connectDatabase } from "./config/database.js";
import { env } from "./config/env.js";
import { stripeWebhook } from "./controllers/order.controller.js";
import errorMiddleware from "./middlewares/error.js";
import { generalLimiter } from "./middlewares/rateLimiter.js";
import analyticsRouter from "./routes/analytics.routes.js";
import courseRouter from "./routes/courseRoutes.js";
import layoutRouter from "./routes/layout.routes.js";
import notificationRouter from "./routes/notification.routes.js";
import orderRouter from "./routes/order.routes.js";
import userRouter from "./routes/userRoutes.js";
import helmet from "helmet";

const app = express();

// Initialize Cloudinary SDK at application level (Required for Vercel Serverless)
connectCloudinary();

app.use(
  (helmet as any)({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
    frameguard: { action: "deny" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    hsts:
      env.nodeEnv === "production"
        ? {
            maxAge: env.hstsMaxAge,
            includeSubDomains: true,
            preload: true,
          }
        : false,
  }),
);

app.use((req, res, next) => {
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  );
  next();
});

// CORS Configuration
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
    maxAge: 600,
    optionsSuccessStatus: 204,
  }),
);

// Database Connection Middleware
const ensureDatabaseConnection = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) => {
  try {
    await connectDatabase();
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Database connection fail: Please check MONGO_URI string or network status.",
    });
  }
};

// Stripe webhook: registered with the raw body parser BEFORE express.json()
// below. Stripe's signature verification requires the exact original
// request bytes — a JSON-parsed-then-reserialized body will not match the
// signature, so this route cannot go through the global JSON parser.
app.post(
  "/api/v1/order/webhook",
  express.raw({ type: "application/json" }),
  ensureDatabaseConnection,
  stripeWebhook,
);

// Body parser & Cookie Parser
app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());

// Apply Rate Limiter globally
app.use(generalLimiter);

// Database Connection Middleware
app.use(ensureDatabaseConnection);

// GET /api/v1/env-check
app.get("/api/v1/env-check", (req, res) => {
  const requiredEnvKeys = [
    "FRONTEND_URLS",
    "MONGO_URI",
    "REDIS_URL",
    "ACCESS_TOKEN",
    "REFRESH_TOKEN",
    "ACCESS_TOKEN_EXPIRE",
    "REFRESH_TOKEN_EXPIRE",
    "ACTIVATION_SECRET",
    "JWT_EXPIRE",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
    "STRIPE_PUBLISHABLE_KEY",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "VDOCIPHER_API_SECRET",
    "SMPT_HOST",
    "SMPT_PORT",
    "SMTP_SERVICE",
    "SMTP_MAIL",
    "SMTP_PASSWORD",
  ];

  const envStatus: Record<string, boolean> = {};
  const missingKeys: string[] = [];

  requiredEnvKeys.forEach((key) => {
    const isPresent = Boolean(process.env[key] && process.env[key]?.trim() !== "");
    envStatus[key] = isPresent;

    if (!isPresent) {
      missingKeys.push(key);
    }
  });

  const allPresent = missingKeys.length === 0;

  res.status(allPresent ? 200 : 500).json({
    success: allPresent,
    message: allPresent
      ? "All required environment variables are set."
      : `Missing ${missingKeys.length} environment variable(s).`,
    missingKeys,
    environment: process.env.NODE_ENV || "development",
    variables: envStatus,
  });
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

app.get("/test", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend is running",
  });
});

// Middleware for Errors
app.use(errorMiddleware);

export default app;