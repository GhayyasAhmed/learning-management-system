import { Redis } from "ioredis";
import { env } from "./env.js";

const redisClient = () => {
    return env.redisUrl
}

export const redis = new Redis(redisClient())

redis.on("connect", () => {
    console.log("Redis connected");
});

redis.on("error", (err) => {
    console.error("Redis client error:", err.message);
});