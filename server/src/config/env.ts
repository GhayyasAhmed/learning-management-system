import "dotenv/config";

function readNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readOrigins(value: string | undefined): string[] {
  if (!value) {
    return ["http://localhost:5173"];
  }

  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

const nodeEnv = process.env.NODE_ENV || "development";
const mongoUri = process.env.MONGO_URI;

if (nodeEnv !== "development" && !mongoUri) {
  throw new Error("MONGO_URI is required outside development.");
}

// Security-critical configuration that must never be missing, empty, or
// silently defaulted, in ANY environment (including development):
//  - ACCESS_TOKEN / REFRESH_TOKEN / ACTIVATION_SECRET sign and verify every
//    JWT this app issues. jsonwebtoken will sign/verify a token with an
//    empty-string secret without error, producing tokens anyone could forge
//    by re-signing with that same empty secret — there is no safe fallback
//    value for a signing secret.
//  - REDIS_URL backs the entire session store (every authenticated request
//    reads the user's session from Redis); without it nothing can
//    authenticate, so unlike the optional third-party integrations
//    (Cloudinary/Stripe/SMTP), it is required to boot.
// Unlike MONGO_URI above, none of these get an environment-specific
// fallback — a missing signing secret is exactly as dangerous in
// development as it is in production.
const REQUIRED_SECRETS = [
  "ACCESS_TOKEN",
  "REFRESH_TOKEN",
  "ACTIVATION_SECRET",
  "REDIS_URL",
] as const;

const missingSecrets = REQUIRED_SECRETS.filter((key) => {
  const value = process.env[key];
  return !value || value.trim() === "";
});

if (missingSecrets.length > 0) {
  throw new Error(
    `Missing required environment variable(s): ${missingSecrets.join(", ")}. ` +
      "Set these before starting the server."
  );
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: readNumber(process.env.PORT, 3001),
  mongoUri: mongoUri || "mongodb://localhost:27017/learning-management-system",
  allowedOrigins: readOrigins(process.env.FRONTEND_URLS),
  // Validated above: guaranteed to be non-empty strings past this point.
  accessTokenSecret: process.env.ACCESS_TOKEN as string,
  refreshTokenSecret: process.env.REFRESH_TOKEN as string,
  activationSecret: process.env.ACTIVATION_SECRET as string,
  redisUrl: process.env.REDIS_URL as string,
};