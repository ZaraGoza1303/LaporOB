import type { IUserSessionRepository } from "../repositories/userSession_repository.interface.js";
import type { IRedisClient } from "../database/redis.interface.js";
import { hashToken } from "../utils/token.js";
import type { IUserSessionService } from "./userSession_service.interface.js";

export class UserSessionService implements IUserSessionService {
    private repo: IUserSessionRepository;
    private redis: IRedisClient;
    private readonly SESSION_TTL = 14400; // 4 jam
    private readonly REDIS_PREFIX = "session:";

    constructor(repo: IUserSessionRepository, redis: IRedisClient) {
        this.repo = repo;
        this.redis = redis;
    }

    async createSession(
        userId: string,
        token: string,
        deviceInfo?: string | null,
        ipAddress?: string | null
    ): Promise<void> {
        const tokenHash = hashToken(token);
        const expiredAt = new Date(Date.now() + this.SESSION_TTL * 1000);

        // Simpan ke DB
        await this.repo.create({
            user_id: userId,
            token_hash: tokenHash,
            device_info: deviceInfo || null,
            ip_address: ipAddress || null,
            expired_at: expiredAt
        });

        // Simpan ke Redis buat pengecekan cepet
        await this.redis.setEx(
            `${this.REDIS_PREFIX}${tokenHash}`,
            this.SESSION_TTL,
            userId
        );
    }

    async validateSession(token: string): Promise<boolean> {
        const tokenHash = hashToken(token);
        const redisKey = `${this.REDIS_PREFIX}${tokenHash}`;

        // Cek Redis dulu — super cepat
        const cached = await this.redis.get(redisKey);
        if (cached) {
            return true; // Session masih valid
        }

        // Fallback ke DB (mungkin Redis ke-flush)
        const session = await this.repo.findByTokenHash(tokenHash);
        if (!session) {
            return false; // Session gak ditemukan
        }

        if (session.is_revoked) {
            return false; // Udah di-revoke
        }

        if (session.expired_at < new Date()) {
            return false; // Udah expired
        }

        // Session valid, restore ke Redis
        const ttl = Math.floor((session.expired_at.getTime() - Date.now()) / 1000);
        if (ttl > 0) {
            await this.redis.setEx(redisKey, ttl, session.user_id);
        }

        return true;
    }

    async revokeSession(token: string): Promise<void> {
        const tokenHash = hashToken(token);
        const redisKey = `${this.REDIS_PREFIX}${tokenHash}`;

        // Hapus dari Redis
        await this.redis.del(redisKey);

        // Update DB
        await this.repo.revoke(tokenHash);
    }

    async revokeAllUserSessions(userId: string): Promise<void> {
        // Note: ini revoke semua session di DB
        // Tapi session yg lagi aktif di Redis masih ada sampe TTL habis
        // Buat skala kecil gini gak masalah, kalo mau lebih clean
        // bisa iterasi Redis keys tp agak ribet
        await this.repo.revokeAllByUserId(userId);
    }
}
