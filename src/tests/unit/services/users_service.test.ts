import { beforeEach, describe, expect, it } from "vitest";
import { UsersRepository } from '../../../repositories/users_repository';
import { mockDeep, mockReset } from "vitest-mock-extended";
import { PrismaClient, User } from '../../../generated/prisma/client';
import { UsersService } from '../../../services/users_service';
import type { IRedisClient } from "../../../database/redis.interface";
import type { IEmailService } from '../../../services/email_service.interface';
import { AppSettingService } from '../../../services/appSetting_service';
import { AppSettingRepository } from '../../../repositories/appSetting_repository';
import type { UserSearchQuery } from "../../../dto/admin";
import type { PublicUser } from "../../../types/users";
import type { PaginatedResponse } from "../../../types/response";
import type { UserWithRoleAndToken } from "../../../repositories/users_repository.interface";
import type { PenugasanWithLokasi } from "../../../repositories/ob_repository.interface";

const mockDB = mockDeep<PrismaClient>();
const mockRedis = mockDeep<IRedisClient>();
const mockEmailService = mockDeep<IEmailService>();

const mockUserRepo = new UsersRepository(mockDB);
const mockAppSettingRepo = new AppSettingRepository(mockDB);
const mockAppSettingService = new AppSettingService(mockAppSettingRepo, mockRedis);
const mockUsersService = new UsersService(mockUserRepo, mockRedis, mockEmailService, mockAppSettingService);

beforeEach(() => {
  mockReset(mockDB);
  mockReset(mockRedis);
  mockReset(mockEmailService);
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

// Fungsi generate fake data dan bisa juga override
function createFakeUserWithRoleAndToken(overrides?: Partial<UserWithRoleAndToken>): UserWithRoleAndToken {
  return {
    id: 'e2fbdc6f-ec0d-4547-a51d-a81b69741ed2',
    username: 'farhan_ob',
    email: 'farhan_ob@gmail.com',
    nama_lengkap: 'Farhan OB',
    profile_picture: null,
    role_id: '852a6e0e-1bcf-4578-b93b-46f893544bfc',
    is_active: true,
    is_deleted: false,
    created_at: new Date('2026-01-01T00:00:00Z'),
    updated_at: new Date('2026-01-01T00:00:00Z'),
    role: { nama_role: 'OB' },
    tokens: [],
    ...overrides,
  };
}

// Fungsi generate fake data dan bisa juga override
function createFakePenugasan(userId: string, overrides?: Partial<PenugasanWithLokasi>): PenugasanWithLokasi {
  return {
    id: 'penugasan-1',
    user_id: userId,
    lokasi_id: 'lokasi-1',
    bulan: 1,
    tahun: 2026,
    created_at: new Date('2026-01-01T00:00:00Z'),
    updated_at: new Date('2026-01-01T00:00:00Z'),
    lokasi: {
      id: 'lokasi-1',
      nama_lokasi: 'Jakarta',
      alamat: 'Jl. Merdeka',
      created_at: new Date('2026-01-01T00:00:00Z'),
      updated_at: new Date('2026-01-01T00:00:00Z'),
    },
    ...overrides,
  } as PenugasanWithLokasi;
}

describe('UsersService.getAll', () => {
  it('mengembalikan data semua user dengan limit 10 dan query kosong, cache miss', async () => {
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

    mockRedis.get.mockResolvedValue(null);

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
        total_pages: 1,
      },
    };

    const data = await mockUsersService.getAll(page, limit, query);

    expect(mockRedis.setEx).toHaveBeenCalledWith(
      expect.stringContaining('users:all:page=1:limit=10'),
      300,
      JSON.stringify(expected)
    );
    expect(mockRedis.sAdd).toHaveBeenCalledWith('users:all:keys', expect.stringContaining('users:all:page=1:limit=10'));
    expect(data).toEqual(expected);
  });

  it('mengembalikan data dari cache jika cache hit', async () => {
    const query: UserSearchQuery = {
      search: null,
      role_id: null,
    };
    const page = 1;
    const limit = 10;

    const fakeUsers: PublicUser[] = [createFakePublicUser()];

    const cachedData: PaginatedResponse<PublicUser> = {
      items: fakeUsers,
      next_cursor: null,
      meta: {
        total_items: 1,
        current_page: page,
        limit: limit,
        total_pages: 1,
      },
    };

    // Mock Redis untuk return cached data sebagai string
    const cachedString = JSON.stringify(cachedData);
    mockRedis.get.mockResolvedValue(cachedString);

    const data = await mockUsersService.getAll(page, limit, query);

    // Parse kembali karena service akan parse hasil dari redis
    expect(data).toEqual(JSON.parse(cachedString));
  });
});

describe('UsersService.getByID', () => {
  it('mengembalikan user detail dengan penugasan jika user adalah OB', async () => {
    const userId = 'e2fbdc6f-ec0d-4547-a51d-a81b69741ed2';

    const fakeUser = createFakeUserWithRoleAndToken({
      id: userId,
      role: { nama_role: 'OB' },
    });

    const fakePenugasan: PenugasanWithLokasi[] = [
      createFakePenugasan(userId),
    ];

    // "as User" karena findmany prisma gak omit password, sedangkan ini fake data menggunakan type PublicUser
    // Jadi harus di convert ke model User agar bisa meskipun gak provide password
    mockDB.user.findFirst.mockResolvedValue(fakeUser as unknown as User);
    mockDB.penugasanOb.findMany.mockResolvedValue(fakePenugasan);

    const data = await mockUsersService.getByID(userId);

    expect(data).toEqual({
      ...fakeUser,
      penugasan: fakePenugasan,
    });
  });

  it('mengembalikan null jika user tidak ditemukan', async () => {
    const userId = 'user-not-exist';

    mockDB.user.findFirst.mockResolvedValue(null);

    const data = await mockUsersService.getByID(userId);

    expect(data).toBeNull();
  });

  it('mengembalikan user tanpa penugasan jika user bukan OB', async () => {
    const userId = 'admin-user-id';

    const fakeUser = createFakeUserWithRoleAndToken({
      id: userId,
      username: 'admin_user',
      email: 'admin@gmail.com',
      nama_lengkap: 'Admin User',
      role_id: 'role-admin',
      role: { nama_role: 'ADMIN' },
    });

    // "as User" karena findmany prisma gak omit password, sedangkan ini fake data menggunakan type PublicUser
    // Jadi harus di convert ke model User agar bisa meskipun gak provide password
    mockDB.user.findFirst.mockResolvedValue(fakeUser as unknown as User);

    const data = await mockUsersService.getByID(userId);

    expect(data?.penugasan).toEqual([]);
    expect(data?.role?.nama_role).toBe('ADMIN');
  });
});
