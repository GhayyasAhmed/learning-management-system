import { Redis } from "ioredis";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";

const redisClient = () => {
    return env.redisUrl
}

export const redis = new Redis(redisClient())

redis.on("connect", () => {
    logger.info("redis_connected");
});

redis.on("ready", () => {
    logger.info("redis_ready");
});

redis.on("reconnecting", () => {
    logger.warn("redis_reconnecting");
});

redis.on("close", () => {
    logger.warn("redis_closed");
});

redis.on("error", (err) => {
    logger.error("redis_client_error", { message: err.message });
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
        logger.warn("redis_get_failed", { key, message: error.message });
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
        logger.warn("redis_set_failed", { key, message: error.message });
    }
};

export const cacheDel = async (key: string): Promise<void> => {
    try {
        await redis.del(key);
    } catch (error: any) {
        logger.warn("redis_del_failed", { key, message: error.message });
    }
};