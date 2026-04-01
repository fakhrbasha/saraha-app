import { createClient } from "redis"
import { REDIS_URL } from "../../../../config/config.service.js";

export const redisClient = createClient({
    url: REDIS_URL
});

export const redisConnection = async () => {
    try {
        await redisClient.connect()
        console.log("redis connected");
    } catch (error) {
        console.log("error to connext redis", error);
    }
}