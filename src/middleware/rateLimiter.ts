import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import redisClient from "../database/redis.js";
import { sendErrorResponse } from "../utils/response.js";

export const loginLimiter = rateLimit({
    store: new RedisStore({
        sendCommand: (...args: string[]) => redisClient.sendCommand(args),
    }),
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: sendErrorResponse("Terlalu banyak percobaan login, coba lagi dalam 15 menit"),
});
