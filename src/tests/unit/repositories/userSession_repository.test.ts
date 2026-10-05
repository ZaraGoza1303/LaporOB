import { beforeEach, describe, expect, it } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';
import { PrismaClient, UserSession } from '../../../generated/prisma/client.js';
import { UserSessionRepository } from '../../../repositories/userSession_repository.js';

const mockDB = mockDeep<PrismaClient>();
const mockSessionRepo = new UserSessionRepository(mockDB);

beforeEach(() => {
    mockReset(mockDB);
});

const userId = 'e2fbdc6f-ec0d-4547-a51d-a81b69741ed2';
const tokenHash = 'hash-token-123';

// Fungsi generate fake data dan bisa juga override
function createFakeSession(overrides?: Partial<UserSession>): UserSession {
    return {
        id: 'b7c8d9e0-1f2a-4b3c-9d4e-5f6a7b8c9d0e',
        user_id: userId,
        token_hash: tokenHash,
        device_info: 'Mozilla/5.0',
        ip_address: '127.0.0.1',
        last_activity: null,
        expired_at: new Date('2026-01-01T08:00:00Z'),
        is_revoked: false,
        revoked_at: null,
        created_at: new Date('2026-01-01T00:00:00Z'),
        ...overrides,
    };
}

describe('UserSessionRepository.create', () => {
    it('membuat session baru dengan data yang dikirim', async () => {
        const fakeSession = createFakeSession();
        const req = {
            user_id: userId,
            token_hash: tokenHash,
            device_info: 'Mozilla/5.0',
            ip_address: '127.0.0.1',
            expired_at: new Date('2026-01-01T08:00:00Z'),
        };
        mockDB.userSession.create.mockResolvedValue(fakeSession);

        const data = await mockSessionRepo.create(req);

        expect(mockDB.userSession.create).toHaveBeenCalledWith({ data: req });
        expect(data).toEqual(fakeSession);
    });
});

describe('UserSessionRepository.findByTokenHash', () => {
    it('mengembalikan session sesuai token hash', async () => {
        const fakeSession = createFakeSession();
        mockDB.userSession.findUnique.mockResolvedValue(fakeSession);

        const data = await mockSessionRepo.findByTokenHash(tokenHash);

        expect(mockDB.userSession.findUnique).toHaveBeenCalledWith({
            where: { token_hash: tokenHash },
        });
        expect(data).toEqual(fakeSession);
    });

    it('mengembalikan null jika session tidak ditemukan', async () => {
        mockDB.userSession.findUnique.mockResolvedValue(null);

        const data = await mockSessionRepo.findByTokenHash('hash-tidak-ada');

        expect(data).toBeNull();
    });
});

describe('UserSessionRepository.revoke', () => {
    it('menandai session sebagai revoked', async () => {
        mockDB.userSession.update.mockResolvedValue(createFakeSession({ is_revoked: true }));

        await mockSessionRepo.revoke(tokenHash);

        expect(mockDB.userSession.update).toHaveBeenCalledWith({
            where: { token_hash: tokenHash },
            data: { is_revoked: true, revoked_at: expect.any(Date) },
        });
    });
});

describe('UserSessionRepository.revokeAllByUserId', () => {
    it('menandai semua session aktif milik user sebagai revoked', async () => {
        mockDB.userSession.updateMany.mockResolvedValue({ count: 2 });

        await mockSessionRepo.revokeAllByUserId(userId);

        expect(mockDB.userSession.updateMany).toHaveBeenCalledWith({
            where: { user_id: userId, is_revoked: false },
            data: { is_revoked: true, revoked_at: expect.any(Date) },
        });
    });
});

describe('UserSessionRepository.deleteExpired', () => {
    it('menghapus session expired dan mengembalikan jumlah yang dihapus', async () => {
        mockDB.userSession.deleteMany.mockResolvedValue({ count: 3 });

        const data = await mockSessionRepo.deleteExpired();

        expect(mockDB.userSession.deleteMany).toHaveBeenCalledWith({
            where: {
                OR: [
                    { expired_at: { lt: expect.any(Date) } },
                    { is_revoked: true, revoked_at: { lt: expect.any(Date) } },
                ],
            },
        });
        expect(data).toBe(3);
    });
});
