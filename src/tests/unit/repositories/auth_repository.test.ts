import { beforeEach, describe, expect, it } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';
import { PrismaClient, UserToken } from '../../../generated/prisma/client.js';
import { AuthRepository } from '../../../repositories/auth_repository.js';
import type { LoginUserData } from '../../../types/auth.js';

const mockDB = mockDeep<PrismaClient>();
const mockAuthRepo = new AuthRepository(mockDB);

beforeEach(() => {
    mockReset(mockDB);
});

const userId = 'e2fbdc6f-ec0d-4547-a51d-a81b69741ed2';

// Fungsi generate fake data dan bisa juga override
function createFakeLoginUser(overrides?: Partial<LoginUserData>): LoginUserData {
    return {
        id: userId,
        username: 'farhan',
        nama_lengkap: 'Farhan Keren',
        password: 'hashedpassword123',
        is_active: true,
        role: {
            id: '852a6e0e-1bcf-4578-b93b-46f893544bfc',
            nama_role: 'OB',
            created_at: new Date('2026-01-01T00:00:00Z'),
        },
        ...overrides,
    };
}

// Fungsi generate fake data dan bisa juga override
function createFakeUserToken(overrides?: Partial<UserToken>): UserToken {
    return {
        id: 'b7c8d9e0-1f2a-4b3c-9d4e-5f6a7b8c9d0e',
        user_id: userId,
        token_hash: 'hash-token-123',
        type: 'activation',
        expired_at: new Date('2026-01-02T00:00:00Z'),
        used_at: null,
        created_at: new Date('2026-01-01T00:00:00Z'),
        ...overrides,
    };
}

describe('AuthRepository.checkUserToken', () => {
    it('mengembalikan token sesuai hash yang dikirim', async () => {
        const fakeToken = createFakeUserToken();
        mockDB.userToken.findUnique.mockResolvedValue(fakeToken);

        const data = await mockAuthRepo.checkUserToken('hash-token-123');

        expect(mockDB.userToken.findUnique).toHaveBeenCalledWith({
            where: { token_hash: 'hash-token-123' },
        });
        expect(data).toEqual(fakeToken);
    });

    it('mengembalikan null jika token tidak ditemukan', async () => {
        mockDB.userToken.findUnique.mockResolvedValue(null);

        const data = await mockAuthRepo.checkUserToken('hash-tidak-ada');

        expect(data).toBeNull();
    });
});

describe('AuthRepository.login', () => {
    it('mencari user berdasarkan email jika identifier mengandung @', async () => {
        const fakeUser = createFakeLoginUser();
        mockDB.user.findFirst.mockResolvedValue(fakeUser as never);

        const data = await mockAuthRepo.login({ identifier: 'farhan@gmail.com', password: 'rahasia123' });

        expect(mockDB.user.findFirst).toHaveBeenCalledWith({
            where: { email: 'farhan@gmail.com' },
            select: {
                id: true,
                username: true,
                nama_lengkap: true,
                password: true,
                is_active: true,
                role: true,
            },
        });
        expect(data).toEqual(fakeUser);
    });

    it('mencari user berdasarkan username jika identifier bukan email', async () => {
        const fakeUser = createFakeLoginUser();
        mockDB.user.findFirst.mockResolvedValue(fakeUser as never);

        const data = await mockAuthRepo.login({ identifier: 'farhan', password: 'rahasia123' });

        expect(mockDB.user.findFirst).toHaveBeenCalledWith({
            where: { username: 'farhan' },
            select: {
                id: true,
                username: true,
                nama_lengkap: true,
                password: true,
                is_active: true,
                role: true,
            },
        });
        expect(data).toEqual(fakeUser);
    });

    it('mengembalikan null jika user tidak ditemukan', async () => {
        mockDB.user.findFirst.mockResolvedValue(null);

        const data = await mockAuthRepo.login({ identifier: 'tidakada@gmail.com', password: 'rahasia123' });

        expect(data).toBeNull();
    });
});
