import type { UserSession } from "../generated/prisma/client.js";

export interface IUserSessionRepository {
    create(data: {user_id: string, token_hash: string, device_info?: string | null, ip_address?: string | null, expired_at: Date}): Promise<UserSession>;
    findByTokenHash(tokenHash: string): Promise<UserSession | null>;
    revoke(tokenHash: string): Promise<void>;
    revokeAllByUserId(userId: string): Promise<void>;
    deleteExpired(): Promise<number>;
}
