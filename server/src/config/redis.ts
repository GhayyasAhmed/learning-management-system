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


export const sessionKey = (id: string) => `session:${id}`;
export const courseCacheKey = (id: string) => `course:${id}`;
export const courseListCacheKey = () => "courses:all";
export const layoutCacheKey = (type: string) => `layout:${type}`;
export const analyticsCacheKey = (name: string) => `analytics:${name}`;

export const cacheGet = async (key: string): Promise<string | null> => {
    try {
        return await redis.get(key);
    } catch (error: any) {
        console.error(`Redis GET failed for ${key}:`, error.message);
        return null;
    }
};

export const cacheSet = async (
    key: string,
    value: string,
    ttlSeconds: number
): Promise<void> => {
    try {
        await redis.set(key, value, "EX", ttlSeconds);
    } catch (error: any) {
        console.error(`Redis SET failed for ${key}:`, error.message);
    }
};

export const cacheDel = async (key: string): Promise<void> => {
    try {
        await redis.del(key);
    } catch (error: any) {
        console.error(`Redis DEL failed for ${key}:`, error.message);
    }
};