import { createClient } from "redis";

const redisUrl = process.env.REDIS_URL
if(!redisUrl) throw new Error("Redius url isn't defined")

const redisClient = createClient({
    url: redisUrl,
});

redisClient.on("error", (err: unknown) => {
    console.error("Redis Client Error:", err);
});

redisClient.on("connect", () => {
    console.log("Redis connected successfully");
});

redisClient.connect().catch(console.error);

export default redisClient;
