import type { PrismaClient } from "../generated/prisma/client.js";
import type { IUserSessionRepository } from "./userSession_repository.interface.js";
import type { UserSession } from "../generated/prisma/client.js";

export class UserSessionRepository implements IUserSessionRepository {
    private prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    async create(data: {user_id: string, token_hash: string, device_info?: string | null, ip_address?: string | null, expired_at: Date}): Promise<UserSession> {
        const session = await this.prisma.userSession.create({ data });
        return session;
    }

    async findByTokenHash(tokenHash: string): Promise<UserSession | null> {
        const session = await this.prisma.userSession.findUnique({
            where: { token_hash: tokenHash }
        });
        return session;
    }

    async revoke(tokenHash: string): Promise<void> {
        await this.prisma.userSession.update({
            where: { token_hash: tokenHash },
            data: {
                is_revoked: true,
                revoked_at: new Date()
            }
        });
    }

    async revokeAllByUserId(userId: string): Promise<void> {
        await this.prisma.userSession.updateMany({
            where: {
                user_id: userId,
                is_revoked: false
            },
            data: {
                is_revoked: true,
                revoked_at: new Date()
            }
        });
    }

    async deleteExpired(): Promise<number> {
        const result = await this.prisma.userSession.deleteMany({
            where: {
                OR: [
                    { expired_at: { lt: new Date() } },
                    { is_revoked: true, revoked_at: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
                ]
            }
        });
        return result.count;
    }
}
