import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import errorMiddleware from "./middlewares/error.js";
import courseRouter from "./routes/courseRoutes.js";
import notificationRouter from "./routes/notification.routes.js";
import orderRouter from "./routes/order.routes.js";
import userRouter from "./routes/userRoutes.js";
import analyticsRouter from "./routes/analytics.routes.js";
import layoutRouter from "./routes/layout.routes.js";

const app = express()


app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || env.allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS origin is not allowed"));
    },
  }),
);

// body parser
app.use(express.json({limit: "50mb"}))

app.use(cookieParser())


app.use("/api/v1/user", userRouter)
app.use("/api/v1/course", courseRouter)
app.use("/api/v1/order", orderRouter)
app.use("/api/v1/notification", notificationRouter)
app.use("/api/v1/analytic", analyticsRouter)
app.use("/api/v1/layout", layoutRouter)


app.get("/test", (req, res, next)  => {
    res.status(200).json({
        success: true,
        message: "Backend in running"
    })
})

// Middleware for Errors

app.use(errorMiddleware)

// app.all("*", (req: Request,res: Response,next: NextFunction) => {
//     const err = new Error(`ROute ${req.originalUrl} not found`) as any;
//     err.statusCode = 404;
//     next(err)
// })

export default app

