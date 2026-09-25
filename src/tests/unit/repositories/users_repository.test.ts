import { beforeEach, describe, expect, it } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';
import { PrismaClient, User } from '../../../generated/prisma/client.js';
import { UsersRepository } from '../../../repositories/users_repository.js';
import { UserSearchQuery } from '../../../dto/admin.js';
import { PaginatedResponse } from '../../../types/response.js';
import { PublicUser } from '../../../types/users.js';

const mockDB = mockDeep<PrismaClient>();
const mockUsersRepo = new UsersRepository(mockDB);

beforeEach(() => {
  mockReset(mockDB);
});


// Fungsi generate fake data dan bisa juga override
function createFakePublicUser(overrides?: Partial<PublicUser>): PublicUser {
  return {
    id: 'e2fbdc6f-ec0d-4547-a51d-a81b69741ed2',
    username: 'farhan',
    email: 'farhan@gmail.com',
    nama_lengkap: 'farhan_keren',
    profile_picture: null,
    role_id: '852a6e0e-1bcf-4578-b93b-46f893544bfc',
    is_active: true,
    is_deleted: false,
    created_at: new Date('2026-01-01T00:00:00Z'),
    updated_at: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

describe('UsersRepository.getAll', () => {
    it('mengembalikan data semua user dengan limit 10 dan query kosong', async () => {
        const query: UserSearchQuery = {
            search: null,
            role_id: null,
        };
        const page = 1;
        const limit = 10;
        
        const fakeUsers: PublicUser[] = [
            createFakePublicUser(),
            createFakePublicUser({
                id: 'f6e0481d-67d4-449b-b3dc-376e72bdcf28',
                username: 'orang_keren',
                email: 'orangKeren@gmail.com',
                nama_lengkap: 'orang_keren_banget',
            }),
        ];

        // "as User" karena findmany prisma gak omit password, sedangkan ini fake data menggunakan type PublicUser
        // Jadi harus di convert ke model User agar bisa meskipun gak provide password
        mockDB.user.findMany.mockResolvedValue(fakeUsers as unknown as User[]);
        mockDB.user.count.mockResolvedValue(2);

        const expected: PaginatedResponse<PublicUser> = {
            items: fakeUsers,
            next_cursor: null,
            meta: {
                total_items: 2,
                current_page: page,
                limit: limit,
                total_pages: 1
            }
        };

        const data = await mockUsersRepo.getAll(page, limit, query);
        expect(data).toEqual(expected);
    });

    it('mengembalikan data semua user dengan hasil kosong menggunakan limit 10 dan query kosong', async () => {
        const query: UserSearchQuery = {
            search: null,
            role_id: null,
        };
        const page = 1;
        const limit = 10;
        
        const fakeUsers: PublicUser[] = [];

        mockDB.user.findMany.mockResolvedValue(fakeUsers as unknown as User[]);
        mockDB.user.count.mockResolvedValue(0);

        const expected: PaginatedResponse<PublicUser> = {
            items: fakeUsers,
            next_cursor: null,
            meta: {
                total_items: 0,
                current_page: 1,
                limit: 10,
                total_pages: 0
            }
        };

        const data = await mockUsersRepo.getAll(page, limit, query);
        expect(data).toEqual(expected);
    });

    it('mengembalikan data semua user dengan hasil query yang dicari menggunakan limit 10 ', async () => {
        const query: UserSearchQuery = {
            search: "orang",
            role_id: null,
        };
        const page = 1;
        const limit = 10
        
        const fakeUsers: PublicUser[] = [
            createFakePublicUser(),
            createFakePublicUser({
                id: 'f6e0481d-67d4-449b-b3dc-376e72bdcf28',
                username: 'orang_keren',
                email: 'orangKeren@gmail.com',
                nama_lengkap: 'orang_keren_banget',
            }),
        ];

        const fakeUsersExpected = [fakeUsers[1]]
        mockDB.user.findMany.mockResolvedValue(fakeUsersExpected as unknown as User[]);
        mockDB.user.count.mockResolvedValue(1);

        const expected: PaginatedResponse<PublicUser> = {
            items: fakeUsersExpected,
            next_cursor: null,
            meta: {
                total_items: 1,
                current_page: page,
                limit: limit,
                total_pages: 1
            }
        };

        const data = await mockUsersRepo.getAll(page, limit, query);
        
        expect(mockDB.user.findMany).toHaveBeenCalledWith({
            where: expect.objectContaining({
                is_deleted: false,
                OR: [
                    { username: { contains: 'orang', mode: 'insensitive' } },
                    { nama_lengkap: { contains: 'orang', mode: 'insensitive' } },
                ]
            }),
            skip: 0,
            take: 10,
            orderBy: { username: 'asc' },
            omit: { password: true }
        });
        expect(data).toEqual(expected);
    });

    it('mengembalikan data semua user pada page ke 2 dengan menggunakan limit 2', async () => {
        const query: UserSearchQuery = {
            search: null,
            role_id: null,
        };
        const page = 2;
        const limit = 2;
        
        const fakeUsers: PublicUser[] = [
            createFakePublicUser(),
            createFakePublicUser({
                id: 'f6e0481d-67d4-449b-b3dc-376e72bdcf28',
                username: 'orang_keren',
                email: 'orangKeren@gmail.com',
                nama_lengkap: 'orang_keren_banget',
            }),
            createFakePublicUser({
                id: 'f6682114-0fdf-42da-94fd-d0f051734cf7',
                username: 'orang_baik',
                email: 'orangBaik@gmail.com',
                nama_lengkap: 'orang_baik_banget',
            }),
        ];

        const pageTwoFakeUsers = [fakeUsers[2]];
        mockDB.user.findMany.mockResolvedValue(pageTwoFakeUsers as unknown as User[]);
        mockDB.user.count.mockResolvedValue(3);

        const expected: PaginatedResponse<PublicUser> = {
            items: pageTwoFakeUsers,
            next_cursor: null,
            meta: {
                total_items: 3,
                current_page: page,
                limit: limit,
                total_pages: 2
            }
        };

        const data = await mockUsersRepo.getAll(page, limit, query);
        
        expect(mockDB.user.findMany).toHaveBeenCalledWith({
            where: { is_deleted: false },
            skip: 2,
            take: 2,
            orderBy: { username: 'asc' },
            omit: { password: true }
        });
        expect(data).toEqual(expected);
    });
});
