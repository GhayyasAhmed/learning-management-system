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

console.log("nodeEnv", nodeEnv)
console.log("mongoUri", mongoUri)
console.log("frontend", process.env.FRONTEND_URLS)

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: readNumber(process.env.PORT, 3001),
  mongoUri: mongoUri || "mongodb://localhost:27017/learning-management-system",
  allowedOrigins: readOrigins(process.env.FRONTEND_URLS),
};
