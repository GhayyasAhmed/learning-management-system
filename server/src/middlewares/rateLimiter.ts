import { rateLimit } from "express-rate-limit";

function readNumber(value: string | undefined, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const baseOptions = {
    standardHeaders: "draft-8" as const,
    legacyHeaders: false,
    ipv6Subnet: 56,
};

function buildLimiter(
    windowEnvKey: string,
    limitEnvKey: string,
    defaultWindowMs: number,
    defaultLimit: number,
    message: string
) {
    return rateLimit({
        ...baseOptions,
        windowMs: readNumber(process.env[windowEnvKey], defaultWindowMs),
        limit: readNumber(process.env[limitEnvKey], defaultLimit),
        message: { success: false, message },
    });
}

export const generalLimiter = buildLimiter(
    "RATE_LIMIT_GENERAL_WINDOW_MS", "RATE_LIMIT_GENERAL_MAX",
    15 * 60 * 1000, 500, "Too many requests. Please try again later."
);

export const authLimiter = buildLimiter(
    "RATE_LIMIT_AUTH_WINDOW_MS", "RATE_LIMIT_AUTH_MAX",
    15 * 60 * 1000, 20, "Too many attempts. Please try again later."
);

export const strictAuthLimiter = buildLimiter(
    "RATE_LIMIT_STRICT_AUTH_WINDOW_MS", "RATE_LIMIT_STRICT_AUTH_MAX",
    15 * 60 * 1000, 8, "Too many attempts. Please try again later."
);

export const passwordLimiter = buildLimiter(
    "RATE_LIMIT_PASSWORD_WINDOW_MS", "RATE_LIMIT_PASSWORD_MAX",
    60 * 60 * 1000, 10, "Too many attempts. Please try again later."
);

export const paymentLimiter = buildLimiter(
    "RATE_LIMIT_PAYMENT_WINDOW_MS", "RATE_LIMIT_PAYMENT_MAX",
    15 * 60 * 1000, 15, "Too many payment attempts. Please try again later."
);

export const contentLimiter = buildLimiter(
    "RATE_LIMIT_CONTENT_WINDOW_MS", "RATE_LIMIT_CONTENT_MAX",
    15 * 60 * 1000, 30, "Too many submissions. Please slow down."
);

export const videoOtpLimiter = buildLimiter(
    "RATE_LIMIT_VIDEO_OTP_WINDOW_MS", "RATE_LIMIT_VIDEO_OTP_MAX",
    10 * 60 * 1000, 20, "Too many requests. Please try again later."
);

export const uploadLimiter = buildLimiter(
    "RATE_LIMIT_UPLOAD_WINDOW_MS", "RATE_LIMIT_UPLOAD_MAX",
    60 * 60 * 1000, 30, "Too many uploads. Please try again later."
);

export const publicApiLimiter = buildLimiter(
    "RATE_LIMIT_PUBLIC_WINDOW_MS", "RATE_LIMIT_PUBLIC_MAX",
    15 * 60 * 1000, 200, "Too many requests. Please try again later."
);