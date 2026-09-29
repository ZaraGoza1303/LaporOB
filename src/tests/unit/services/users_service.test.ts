import { beforeEach, describe, expect, it, vi } from "vitest";
import { UsersRepository } from '../../../repositories/users_repository';
import { mockDeep, mockReset } from "vitest-mock-extended";
import { PrismaClient, User, Role } from '../../../generated/prisma/client';
import { UsersService } from '../../../services/users_service';
import type { IRedisClient } from "../../../database/redis.interface";
import type { IEmailService } from '../../../services/email_service.interface';
import { AppSettingService } from '../../../services/appSetting_service';
import { AppSettingRepository } from '../../../repositories/appSetting_repository';
import type { UserSearchQuery } from "../../../dto/admin";
import type { PublicUser } from "../../../types/users";
import type { PaginatedResponse } from "../../../types/response";
import type { ProfileUser, UserWithRoleAndToken } from "../../../repositories/users_repository.interface";
import type { PenugasanWithLokasi } from "../../../repositories/ob_repository.interface";
import type { CreateUserReq, UpdateUserReq } from "../../../dto/users";
import bcrypt from "bcrypt";
import * as emailUtils from "../../../utils/email";
import * as tokenUtils from "../../../utils/token";
import * as urlUtils from "../../../utils/url";
import { AppError } from "../../../utils/error";

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
  vi.restoreAllMocks();
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
    const cachedString = JSON.stringify(cachedData);
    mockRedis.get.mockResolvedValue(cachedString);

    const data = await mockUsersService.getAll(page, limit, query);

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

    mockDB.user.findFirst.mockResolvedValue(fakeUser as unknown as User);

    const data = await mockUsersService.getByID(userId);

    expect(data?.penugasan).toEqual([]);
    expect(data?.role?.nama_role).toBe('ADMIN');
  });
});

describe('UsersService.getByEmail', () => {
  it('mengembalikan data user jika email ditemukan', async () => {
    const email = 'farhan@gmail.com';
    const fakeUser = createFakePublicUser({ email });

    mockDB.user.findFirst.mockResolvedValue(fakeUser as unknown as User);

    const data = await mockUsersService.getByEmail(email);

    expect(data).toEqual(fakeUser);
    expect(mockDB.user.findFirst).toHaveBeenCalledWith({
      where: { email, is_deleted: false },
      omit: { password: true },
    });
  });

  it('mengembalikan null jika user tidak ditemukan', async () => {
    const email = 'notfound@gmail.com';

    mockDB.user.findFirst.mockResolvedValue(null);

    const data = await mockUsersService.getByEmail(email);

    expect(data).toBeNull();
  });
});

describe('UsersService.getUserWithPasswordById', () => {
  it('mengembalikan user beserta password jika user ditemukan', async () => {
    const userId = 'e2fbdc6f-ec0d-4547-a51d-a81b69741ed2';
    const fakeUser = {
      ...createFakePublicUser({ id: userId }),
      password: 'hashedpassword123',
    } as User;

    mockDB.user.findFirst.mockResolvedValue(fakeUser);

    const data = await mockUsersService.getUserWithPasswordById(userId);

    expect(data).toEqual(fakeUser);
    expect(mockDB.user.findFirst).toHaveBeenCalledWith({
      where: { id: userId },
    });
  });

  it('mengembalikan null jika user tidak ditemukan', async () => {
    const userId = 'user-not-found';

    mockDB.user.findFirst.mockResolvedValue(null);

    const data = await mockUsersService.getUserWithPasswordById(userId);

    expect(data).toBeNull();
  });
});

describe('UsersService.getProfile', () => {
  it('mengembalikan profil user dan meresolve URL profile_picture jika user ditemukan', async () => {
    const userId = 'e2fbdc6f-ec0d-4547-a51d-a81b69741ed2';
    const fakeProfileUser: ProfileUser = {
      id: userId,
      username: 'farhan',
      email: 'farhan@gmail.com',
      nama_lengkap: 'Farhan Keren',
      profile_picture: 'uploads/avatars/farhan.png',
      role_id: 'role-123',
      is_active: true,
      is_deleted: false,
      created_at: new Date('2026-01-01T00:00:00Z'),
      updated_at: new Date('2026-01-01T00:00:00Z'),
      role: {
        nama_role: 'OB',
      },
    };

    mockDB.user.findFirst.mockResolvedValue(fakeProfileUser as unknown as User);

    const data = await mockUsersService.getProfile(userId);

    expect(data).toEqual({
      id: fakeProfileUser.id,
      nama_lengkap: fakeProfileUser.nama_lengkap,
      username: fakeProfileUser.username,
      email: fakeProfileUser.email,
      role: fakeProfileUser.role.nama_role,
      profile_picture: urlUtils.resolveFileUrl(fakeProfileUser.profile_picture),
    });
    expect(mockDB.user.findFirst).toHaveBeenCalledWith({
      where: { id: userId, is_deleted: false },
      omit: { password: true },
      include: { role: true },
    });
  });

  it('melempar AppError 404 jika user tidak ditemukan', async () => {
    const userId = 'user-not-found';

    mockDB.user.findFirst.mockResolvedValue(null);

    await expect(mockUsersService.getProfile(userId)).rejects.toThrow(
      new AppError("User tidak ditemukan", 404)
    );
  });
});

describe('UsersService.getByRole', () => {
  it('mengembalikan daftar user sesuai role yang diberikan', async () => {
    const roleName = 'OB';
    const fakeUsers: PublicUser[] = [
      createFakePublicUser({ username: 'ob_satu' }),
      createFakePublicUser({ id: 'uuid-ob-2', username: 'ob_dua' }),
    ];

    mockDB.user.findMany.mockResolvedValue(fakeUsers as unknown as User[]);

    const data = await mockUsersService.getByRole(roleName);

    expect(data).toEqual(fakeUsers);
    expect(mockDB.user.findMany).toHaveBeenCalledWith({
      where: {
        is_deleted: false,
        is_active: true,
        role: {
          nama_role: {
            equals: roleName,
            mode: 'insensitive',
          },
        },
      },
      omit: { password: true },
    });
  });
});

describe('UsersService.create', () => {
  it('berhasil membuat user non-OB, membuat activation token, mengirim email, dan invalidate cache', async () => {
    const req: CreateUserReq = {
      role_id: '852a6e0e-1bcf-4578-b93b-46f893544bfc',
      username: 'karyawan_baru',
      email: 'karyawan@gmail.com',
      nama_lengkap: 'Karyawan Baru',
    };

    const createdUser = {
      ...createFakePublicUser({
        id: 'new-user-id',
        username: req.username,
        email: req.email,
        nama_lengkap: req.nama_lengkap,
        role_id: req.role_id,
      }),
      role: { nama_role: 'KARYAWAN' },
    };

    mockDB.$transaction.mockImplementation(async (callback: any) => {
      return callback({
        user: {
          create: vi.fn().mockResolvedValue(createdUser),
        },
        userToken: {
          create: vi.fn().mockResolvedValue({ id: 'token-id' }),
        },
      });
    });

    mockDB.appSetting.findMany.mockResolvedValue([]);
    const sendRenderedEmailSpy = vi.spyOn(emailUtils, 'sendRenderedEmail').mockResolvedValue(undefined as never);

    await mockUsersService.create(req);

    expect(sendRenderedEmailSpy).toHaveBeenCalledWith(
      mockEmailService,
      req.email,
      expect.stringContaining('Aktivasi Akun'),
      'activation',
      expect.objectContaining({
        userName: req.nama_lengkap,
        activationUrl: expect.stringContaining('/activate-account?token='),
      })
    );
    expect(mockRedis.del).toHaveBeenCalledWith('users:all:*');
  });

  it('berhasil membuat user OB dan mensinkronisasi lokasi penugasan', async () => {
    const req: CreateUserReq = {
      role_id: '852a6e0e-1bcf-4578-b93b-46f893544bfc',
      username: 'ob_baru',
      email: 'ob@gmail.com',
      nama_lengkap: 'OB Baru',
      lokasi_ids: ['lokasi-1', 'lokasi-2'],
    };

    const createdUser = {
      ...createFakePublicUser({
        id: 'new-ob-id',
        username: req.username,
        email: req.email,
        nama_lengkap: req.nama_lengkap,
        role_id: req.role_id,
      }),
      role: { nama_role: 'OB' },
    };

    const mockTxUserCreate = vi.fn().mockResolvedValue(createdUser);
    const mockTxUserTokenCreate = vi.fn().mockResolvedValue({ id: 'token-id' });
    const mockTxPenugasanDeleteMany = vi.fn().mockResolvedValue({ count: 0 });
    const mockTxPenugasanCreateMany = vi.fn().mockResolvedValue({ count: 2 });

    mockDB.$transaction.mockImplementation(async (callback: any) => {
      return callback({
        user: {
          create: mockTxUserCreate,
        },
        userToken: {
          create: mockTxUserTokenCreate,
        },
        penugasanOb: {
          deleteMany: mockTxPenugasanDeleteMany,
          createMany: mockTxPenugasanCreateMany,
        },
      });
    });

    mockDB.appSetting.findMany.mockResolvedValue([]);
    vi.spyOn(emailUtils, 'sendRenderedEmail').mockResolvedValue(undefined as never);

    await mockUsersService.create(req);

    expect(mockTxPenugasanDeleteMany).toHaveBeenCalled();
    expect(mockTxPenugasanCreateMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ ob_id: 'new-ob-id', lokasi_id: 'lokasi-1' }),
        expect.objectContaining({ ob_id: 'new-ob-id', lokasi_id: 'lokasi-2' }),
      ]),
    });
    expect(mockRedis.del).toHaveBeenCalledWith('users:all:*');
  });
});

describe('UsersService.update', () => {
  it('berhasil mengupdate profil user non-OB dan menghapus cache', async () => {
    const userId = 'e2fbdc6f-ec0d-4547-a51d-a81b69741ed2';
    const req: UpdateUserReq = {
      nama_lengkap: 'Nama Baru',
      username: 'username_baru',
      email: 'baru@gmail.com',
    };

    const mockTxUserUpdate = vi.fn().mockResolvedValue({});
    mockDB.$transaction.mockImplementation(async (callback: any) => {
      return callback({
        user: {
          update: mockTxUserUpdate,
        },
      });
    });

    await mockUsersService.update(userId, req);

    expect(mockTxUserUpdate).toHaveBeenCalledWith({
      where: { id: userId },
      data: {
        nama_lengkap: req.nama_lengkap,
        username: req.username,
        email: req.email,
      },
    });
    expect(mockRedis.del).toHaveBeenCalledWith('users:all:*');
  });

  it('meng-hash password jika update menyertakan password baru', async () => {
    const userId = 'e2fbdc6f-ec0d-4547-a51d-a81b69741ed2';
    const req: UpdateUserReq = {
      password: 'newsecretpassword',
    };

    const bcryptHashSpy = vi.spyOn(bcrypt, 'hash').mockImplementation(async () => 'hashed_password_mock' as never);

    const mockTxUserUpdate = vi.fn().mockResolvedValue({});
    mockDB.$transaction.mockImplementation(async (callback: any) => {
      return callback({
        user: {
          update: mockTxUserUpdate,
        },
      });
    });

    await mockUsersService.update(userId, req);

    expect(bcryptHashSpy).toHaveBeenCalledWith('newsecretpassword', 10);
    expect(mockTxUserUpdate).toHaveBeenCalledWith({
      where: { id: userId },
      data: {
        password: 'hashed_password_mock',
      },
    });
    expect(mockRedis.del).toHaveBeenCalledWith('users:all:*');
  });

  it('menyetel is_deleted ke true jika is_active diubah menjadi false', async () => {
    const userId = 'e2fbdc6f-ec0d-4547-a51d-a81b69741ed2';
    const req: UpdateUserReq = {
      is_active: false,
    };

    const mockTxUserUpdate = vi.fn().mockResolvedValue({});
    mockDB.$transaction.mockImplementation(async (callback: any) => {
      return callback({
        user: {
          update: mockTxUserUpdate,
        },
      });
    });

    await mockUsersService.update(userId, req);

    expect(mockTxUserUpdate).toHaveBeenCalledWith({
      where: { id: userId },
      data: {
        is_active: false,
        is_deleted: true,
      },
    });
    expect(mockRedis.del).toHaveBeenCalledWith('users:all:*');
  });

  it('mensinkronisasi lokasi jika user adalah OB dan lokasi_ids disertakan', async () => {
    const userId = 'ob-user-id';
    const req: UpdateUserReq = {
      lokasi_ids: ['lokasi-1'],
    };

    const mockTxUserUpdate = vi.fn().mockResolvedValue({});
    const mockTxUserFindUnique = vi.fn().mockResolvedValue({
      id: userId,
      role: { nama_role: 'OB' },
    });
    const mockTxPenugasanDeleteMany = vi.fn().mockResolvedValue({ count: 0 });
    const mockTxPenugasanCreateMany = vi.fn().mockResolvedValue({ count: 1 });

    mockDB.$transaction.mockImplementation(async (callback: any) => {
      return callback({
        user: {
          update: mockTxUserUpdate,
          findUnique: mockTxUserFindUnique,
        },
        penugasanOb: {
          deleteMany: mockTxPenugasanDeleteMany,
          createMany: mockTxPenugasanCreateMany,
        },
      });
    });

    await mockUsersService.update(userId, req);

    expect(mockTxPenugasanDeleteMany).toHaveBeenCalled();
    expect(mockTxPenugasanCreateMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ ob_id: userId, lokasi_id: 'lokasi-1' }),
      ]),
    });
    expect(mockRedis.del).toHaveBeenCalledWith('users:all:*');
  });
});

describe('UsersService.delete', () => {
  it('berhasil melakukan soft delete user dan menghapus cache', async () => {
    const userId = 'e2fbdc6f-ec0d-4547-a51d-a81b69741ed2';

    mockDB.user.update.mockResolvedValue({} as User);

    await mockUsersService.delete(userId);

    expect(mockDB.user.update).toHaveBeenCalledWith({
      where: { id: userId },
      data: { is_deleted: true },
    });
    expect(mockRedis.del).toHaveBeenCalledWith('users:all:*');
  });
});

describe('UsersService.completeActivation', () => {
  it('berhasil mengaktifkan user dengan hash password baru dan menandai token sudah digunakan', async () => {
    const userId = 'e2fbdc6f-ec0d-4547-a51d-a81b69741ed2';
    const password = 'mySecretPassword123';
    const tokenId = 'token-activation-id';

    const bcryptHashSpy = vi.spyOn(bcrypt, 'hash').mockImplementation(async () => 'hashed_new_password' as never);

    const mockTxUserUpdate = vi.fn().mockResolvedValue({});
    const mockTxUserTokenUpdate = vi.fn().mockResolvedValue({});

    mockDB.$transaction.mockImplementation(async (callback: any) => {
      return callback({
        user: {
          update: mockTxUserUpdate,
        },
        userToken: {
          update: mockTxUserTokenUpdate,
        },
      });
    });

    await mockUsersService.completeActivation(userId, password, tokenId);

    expect(bcryptHashSpy).toHaveBeenCalledWith(password, 10);
    expect(mockTxUserUpdate).toHaveBeenCalledWith({
      where: { id: userId },
      data: {
        is_active: true,
        is_deleted: false,
        password: 'hashed_new_password',
      },
    });
    expect(mockTxUserTokenUpdate).toHaveBeenCalledWith({
      where: { id: tokenId },
      data: { used_at: expect.any(Date) },
    });
  });
});

describe('UsersService.getRoles', () => {
  it('mengembalikan seluruh daftar role dari database terurut asc', async () => {
    const fakeRoles: Role[] = [
      { id: '1', nama_role: 'ADMIN', created_at: new Date() },
      { id: '2', nama_role: 'KARYAWAN', created_at: new Date() },
      { id: '3', nama_role: 'OB', created_at: new Date() },
    ];

    mockDB.role.findMany.mockResolvedValue(fakeRoles);

    const data = await mockUsersService.getRoles();

    expect(data).toEqual(fakeRoles);
    expect(mockDB.role.findMany).toHaveBeenCalledWith({
      orderBy: { nama_role: 'asc' },
    });
  });
});

describe('UsersService.renewActivationToken', () => {
  it('berhasil memperbarui activation token lama, menyimpan token baru, dan mengirim email aktivasi', async () => {
    const userId = 'e2fbdc6f-ec0d-4547-a51d-a81b69741ed2';
    const fakeUser = {
      ...createFakeUserWithRoleAndToken({ id: userId, email: 'farhan@gmail.com', nama_lengkap: 'Farhan Keren' }),
      tokens: [
        {
          id: 'old-token-id',
          type: 'activation',
          expired_at: new Date(Date.now() - 1000),
          created_at: new Date(),
          used_at: null,
        },
      ],
    };

    mockDB.user.findFirst.mockResolvedValue(fakeUser as unknown as User);
    mockDB.userToken.update.mockResolvedValue({} as any);
    mockDB.userToken.create.mockResolvedValue({} as any);
    mockDB.appSetting.findMany.mockResolvedValue([]);

    const sendRenderedEmailSpy = vi.spyOn(emailUtils, 'sendRenderedEmail').mockResolvedValue(undefined as never);

    await mockUsersService.renewActivationToken(userId);

    expect(mockDB.userToken.update).toHaveBeenCalledWith({
      where: { id: 'old-token-id' },
      data: { used_at: expect.any(Date) },
    });
    expect(mockDB.userToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        user: { connect: { id: userId } },
        type: 'activation',
        token_hash: expect.any(String),
        expired_at: expect.any(Date),
      }),
    });
    expect(sendRenderedEmailSpy).toHaveBeenCalledWith(
      mockEmailService,
      fakeUser.email,
      expect.stringContaining('Aktivasi Akun'),
      'activation',
      expect.objectContaining({
        user: { nama_lengkap: fakeUser.nama_lengkap },
        activationUrl: expect.stringContaining('/activate-account?token='),
      })
    );
  });

  it('melempar AppError 404 jika user tidak ditemukan', async () => {
    const userId = 'user-not-found';

    mockDB.user.findFirst.mockResolvedValue(null);

    await expect(mockUsersService.renewActivationToken(userId)).rejects.toThrow(
      new AppError("User tidak ditemukan", 404)
    );
  });
});

describe('UsersService.createPasswordResetToken', () => {
  it('menyimpan token reset password ke database', async () => {
    const userId = 'e2fbdc6f-ec0d-4547-a51d-a81b69741ed2';
    const tokenHash = 'hash-reset-token-123';
    const expiredAt = new Date(Date.now() + 3600 * 1000);

    mockDB.userToken.create.mockResolvedValue({} as any);

    await mockUsersService.createPasswordResetToken(userId, tokenHash, expiredAt);

    expect(mockDB.userToken.create).toHaveBeenCalledWith({
      data: {
        user: { connect: { id: userId } },
        token_hash: tokenHash,
        type: 'password_reset',
        expired_at: expiredAt,
      },
    });
  });
});

describe('UsersService.resetUserPassword', () => {
  it('berhasil mengupdate password user dan menandai token sudah digunakan jika tokenId diberikan', async () => {
    const userId = 'e2fbdc6f-ec0d-4547-a51d-a81b69741ed2';
    const passwordHash = 'new_password_hash';
    const tokenId = 'reset-token-id';

    const mockTxUserUpdate = vi.fn().mockResolvedValue({});
    const mockTxUserTokenUpdate = vi.fn().mockResolvedValue({});

    mockDB.$transaction.mockImplementation(async (callback: any) => {
      return callback({
        user: {
          update: mockTxUserUpdate,
        },
        userToken: {
          update: mockTxUserTokenUpdate,
        },
      });
    });

    await mockUsersService.resetUserPassword(userId, passwordHash, tokenId);

    expect(mockTxUserUpdate).toHaveBeenCalledWith({
      where: { id: userId },
      data: { password: passwordHash },
    });
    expect(mockTxUserTokenUpdate).toHaveBeenCalledWith({
      where: { id: tokenId },
      data: { used_at: expect.any(Date) },
    });
  });

  it('berhasil mengupdate password user tanpa update token jika tokenId tidak diberikan', async () => {
    const userId = 'e2fbdc6f-ec0d-4547-a51d-a81b69741ed2';
    const passwordHash = 'new_password_hash';

    const mockTxUserUpdate = vi.fn().mockResolvedValue({});
    const mockTxUserTokenUpdate = vi.fn();

    mockDB.$transaction.mockImplementation(async (callback: any) => {
      return callback({
        user: {
          update: mockTxUserUpdate,
          userToken: {
            update: mockTxUserTokenUpdate,
          },
        },
      });
    });

    await mockUsersService.resetUserPassword(userId, passwordHash);

    expect(mockTxUserUpdate).toHaveBeenCalledWith({
      where: { id: userId },
      data: { password: passwordHash },
    });
    expect(mockTxUserTokenUpdate).not.toHaveBeenCalled();
  });
});
