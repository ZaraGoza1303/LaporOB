import { beforeEach, describe, expect, it } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";
import { PrismaClient, UserSession } from "../../../generated/prisma/client";
import { UserSessionRepository } from "../../../repositories/userSession_repository";
import { UserSessionService } from "../../../services/userSession_service";
import type { IRedisClient } from "../../../database/redis.interface";
import * as tokenUtils from "../../../utils/token";

const mockDB = mockDeep<PrismaClient>();
const mockRedis = mockDeep<IRedisClient>();

const mockSessionRepo = new UserSessionRepository(mockDB);
const mockSessionService = new UserSessionService(mockSessionRepo, mockRedis);

beforeEach(() => {
    mockReset(mockDB);
    mockReset(mockRedis);
});

const userId = 'e2fbdc6f-ec0d-4547-a51d-a81b69741ed2';
const token = 'jwt-token-plain';
const tokenHash = 'hash-jwt-token';

// Fungsi generate fake data dan bisa juga override
function createFakeSession(overrides?: Partial<UserSession>): UserSession {
    return {
        id: 'b7c8d9e0-1f2a-4b3c-9d4e-5f6a7b8c9d0e',
        user_id: userId,
        token_hash: tokenHash,
        device_info: 'Mozilla/5.0',
        ip_address: '127.0.0.1',
        last_activity: null,
        expired_at: new Date(Date.now() + 3600 * 1000),
        is_revoked: false,
        revoked_at: null,
        created_at: new Date('2026-01-01T00:00:00Z'),
        ...overrides,
    };
}

describe('UserSessionService.createSession', () => {
    it('membuat session di database dan menyimpannya ke redis selama 4 jam', async () => {
        mockDB.userSession.create.mockResolvedValue(createFakeSession());

        await mockSessionService.createSession(userId, token, 'Mozilla/5.0', '127.0.0.1');

        expect(mockDB.userSession.create).toHaveBeenCalledWith({
            data: {
                user_id: userId,
                token_hash: tokenUtils.hashToken(token),
                device_info: 'Mozilla/5.0',
                ip_address: '127.0.0.1',
                expired_at: expect.any(Date),
            },
        });
        expect(mockRedis.setEx).toHaveBeenCalledWith(`session:${tokenUtils.hashToken(token)}`, 14400, userId);
    });

    it('menyimpan null untuk device dan ip jika tidak dikirim', async () => {
        mockDB.userSession.create.mockResolvedValue(createFakeSession());

        await mockSessionService.createSession(userId, token);

        expect(mockDB.userSession.create).toHaveBeenCalledWith({
            data: expect.objectContaining({ device_info: null, ip_address: null }),
        });
    });
});

describe('UserSessionService.validateSession', () => {
    it('mengembalikan true tanpa menyentuh database jika cache hit', async () => {
        mockRedis.get.mockResolvedValue(userId);

        const data = await mockSessionService.validateSession(token);

        expect(data).toBe(true);
        expect(mockDB.userSession.findUnique).not.toHaveBeenCalled();
    });

    it('mengembalikan false jika session tidak ditemukan di cache maupun database', async () => {
        mockRedis.get.mockResolvedValue(null);
        mockDB.userSession.findUnique.mockResolvedValue(null);

        const data = await mockSessionService.validateSession(token);

        expect(data).toBe(false);
    });

    it('mengembalikan false jika session sudah di-revoke', async () => {
        mockRedis.get.mockResolvedValue(null);
        mockDB.userSession.findUnique.mockResolvedValue(createFakeSession({ is_revoked: true }));

        const data = await mockSessionService.validateSession(token);

        expect(data).toBe(false);
        expect(mockRedis.setEx).not.toHaveBeenCalled();
    });

    it('mengembalikan false jika session sudah expired', async () => {
        mockRedis.get.mockResolvedValue(null);
        mockDB.userSession.findUnique.mockResolvedValue(
            createFakeSession({ expired_at: new Date(Date.now() - 1000) })
        );

        const data = await mockSessionService.validateSession(token);

        expect(data).toBe(false);
    });

    it('mengembalikan true dan mengisi ulang cache jika session valid di database', async () => {
        mockRedis.get.mockResolvedValue(null);
        mockDB.userSession.findUnique.mockResolvedValue(
            createFakeSession({ expired_at: new Date(Date.now() + 3600 * 1000) })
        );

        const data = await mockSessionService.validateSession(token);

        expect(data).toBe(true);
        expect(mockRedis.setEx).toHaveBeenCalledWith(
            `session:${tokenUtils.hashToken(token)}`,
            expect.any(Number),
            userId
        );
    });
});

describe('UserSessionService.revokeSession', () => {
    it('menghapus cache dan menandai session sebagai revoked', async () => {
        mockDB.userSession.update.mockResolvedValue(createFakeSession({ is_revoked: true }));

        await mockSessionService.revokeSession(token);

        expect(mockRedis.del).toHaveBeenCalledWith(`session:${tokenUtils.hashToken(token)}`);
        expect(mockDB.userSession.update).toHaveBeenCalledWith({
            where: { token_hash: tokenUtils.hashToken(token) },
            data: { is_revoked: true, revoked_at: expect.any(Date) },
        });
    });
});

describe('UserSessionService.revokeAllUserSessions', () => {
    it('menandai semua session milik user sebagai revoked', async () => {
        mockDB.userSession.updateMany.mockResolvedValue({ count: 2 });

        await mockSessionService.revokeAllUserSessions(userId);

        expect(mockDB.userSession.updateMany).toHaveBeenCalledWith({
            where: { user_id: userId, is_revoked: false },
            data: { is_revoked: true, revoked_at: expect.any(Date) },
        });
    });
});
