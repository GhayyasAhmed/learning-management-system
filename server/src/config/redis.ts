import { Redis } from "ioredis";
import { env } from "./env.js";

const redisClient = () => {
    console.log(`Redis connected`)
    return env.redisUrl
}

export const redis = new Redis(redisClient())