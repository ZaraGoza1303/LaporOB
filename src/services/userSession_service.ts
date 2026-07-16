import type { IUserSessionRepository } from "../repositories/userSession_repository.interface.js";
import type { IRedisClient } from "../database/redis.interface.js";
import { hashToken } from "../utils/token.js";
import type { IUserSessionService } from "./userSession_service.interface.js";

export class UserSessionService implements IUserSessionService {
    private userSessionRepo: IUserSessionRepository;
    private redis: IRedisClient;
    private readonly SESSION_TTL = 14400; // 4 jam
    private readonly REDIS_PREFIX = "session:";

    constructor(userRepo: IUserSessionRepository, redis: IRedisClient) {
        this.userSessionRepo = userRepo;
        this.redis = redis;
    }

    async createSession(userId: string, token: string, deviceInfo?: string | null, ipAddress?: string | null): Promise<void> {
        const tokenHash = hashToken(token);
        const expiredAt = new Date(Date.now() + this.SESSION_TTL * 1000);

        await this.userSessionRepo.create({
            user_id: userId,
            token_hash: tokenHash,
            device_info: deviceInfo || null,
            ip_address: ipAddress || null,
            expired_at: expiredAt
        });

        await this.redis.setEx(`${this.REDIS_PREFIX}${tokenHash}`,this.SESSION_TTL,userId);
    }

    async validateSession(token: string): Promise<boolean> {
        const tokenHash = hashToken(token);
        const redisKey = `${this.REDIS_PREFIX}${tokenHash}`;

        const cached = await this.redis.get(redisKey);
        if (cached) {
            return true; 
        }

        const session = await this.userSessionRepo.findByTokenHash(tokenHash);
        if (!session) {
            return false; 
        }

        if (session.is_revoked) {
            return false; 
        }

        if (session.expired_at < new Date()) {
            return false; 
        }

        const ttl = Math.floor((session.expired_at.getTime() - Date.now()) / 1000);
        if (ttl > 0) {
            await this.redis.setEx(redisKey, ttl, session.user_id);
        }

        return true;
    }

    async revokeSession(token: string): Promise<void> {
        const tokenHash = hashToken(token);
        const redisKey = `${this.REDIS_PREFIX}${tokenHash}`;

        await this.redis.del(redisKey);
        await this.userSessionRepo.revoke(tokenHash);
    }

    async revokeAllUserSessions(userId: string): Promise<void> {
        await this.userSessionRepo.revokeAllByUserId(userId);
    }
}
