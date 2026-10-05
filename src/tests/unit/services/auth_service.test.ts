import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";
import { PrismaClient, UserToken } from "../../../generated/prisma/client";
import { AuthRepository } from "../../../repositories/auth_repository";
import { AuthService } from "../../../services/auth_service";
import type { IUsersService } from "../../../services/users_service.interface";
import type { IUserSessionService } from "../../../services/userSession_service.interface";
import type { IEmailService } from "../../../services/email_service.interface";
import type { IAppSettingService } from "../../../services/appSetting_service.interface";
import type { LoginUserData } from "../../../types/auth";
import type { PublicUser } from "../../../types/users";
import bcrypt from "bcrypt";
import * as jwtUtils from "../../../utils/jwt";
import * as emailUtils from "../../../utils/email";
import * as tokenUtils from "../../../utils/token";
import { AppError } from "../../../utils/error";

const mockDB = mockDeep<PrismaClient>();
const mockUsersService = mockDeep<IUsersService>();
const mockSessionService = mockDeep<IUserSessionService>();
const mockEmailService = mockDeep<IEmailService>();
const mockSettingService = mockDeep<IAppSettingService>();

const mockAuthRepo = new AuthRepository(mockDB);
const mockAuthService = new AuthService(
    mockAuthRepo,
    mockUsersService,
    mockSessionService,
    mockEmailService,
    mockSettingService
);

beforeEach(() => {
    mockReset(mockDB);
    mockReset(mockUsersService);
    mockReset(mockSessionService);
    mockReset(mockEmailService);
    mockReset(mockSettingService);
    vi.restoreAllMocks();
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
        token_hash: tokenUtils.hashToken('plain-token'),
        type: 'activation',
        expired_at: new Date(Date.now() + 3600 * 1000),
        used_at: null,
        created_at: new Date('2026-01-01T00:00:00Z'),
        ...overrides,
    };
}

// Fungsi generate fake data dan bisa juga override
function createFakePublicUser(overrides?: Partial<PublicUser>): PublicUser {
    return {
        id: userId,
        username: 'farhan',
        email: 'farhan@gmail.com',
        nama_lengkap: 'Farhan Keren',
        profile_picture: null,
        role_id: '852a6e0e-1bcf-4578-b93b-46f893544bfc',
        is_active: true,
        is_deleted: false,
        created_at: new Date('2026-01-01T00:00:00Z'),
        updated_at: new Date('2026-01-01T00:00:00Z'),
        ...overrides,
    };
}

describe('AuthService.login', () => {
    it('berhasil login dan membuat session baru', async () => {
        const fakeUser = createFakeLoginUser();
        mockDB.user.findFirst.mockResolvedValue(fakeUser as never);
        vi.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
        vi.spyOn(jwtUtils, 'generateJWTToken').mockResolvedValue('jwt-token-mock');

        const data = await mockAuthService.login({ identifier: 'farhan', password: 'rahasia123' }, 'Mozilla/5.0', '127.0.0.1');

        expect(data).toEqual({ jwt_token: 'jwt-token-mock' });
        expect(mockSessionService.createSession).toHaveBeenCalledWith(userId, 'jwt-token-mock', 'Mozilla/5.0', '127.0.0.1');
    });

    it('melempar AppError 401 jika user tidak ditemukan', async () => {
        mockDB.user.findFirst.mockResolvedValue(null);

        await expect(
            mockAuthService.login({ identifier: 'tidakada', password: 'rahasia123' })
        ).rejects.toThrow(new AppError('Email/Username atau password salah!', 401));
        expect(mockSessionService.createSession).not.toHaveBeenCalled();
    });

    it('melempar AppError 403 jika akun belum diaktivasi', async () => {
        mockDB.user.findFirst.mockResolvedValue(createFakeLoginUser({ password: null }) as never);

        await expect(
            mockAuthService.login({ identifier: 'farhan', password: 'rahasia123' })
        ).rejects.toThrow(new AppError('Akun belum diaktivasi, silahkan aktivasi terlebih dahulu', 403));
    });

    it('melempar AppError 401 jika password salah', async () => {
        mockDB.user.findFirst.mockResolvedValue(createFakeLoginUser() as never);
        vi.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

        await expect(
            mockAuthService.login({ identifier: 'farhan', password: 'salah' })
        ).rejects.toThrow(new AppError('Email/Username atau password salah!', 401));
    });

    it('melempar AppError 403 jika akun sudah tidak aktif', async () => {
        mockDB.user.findFirst.mockResolvedValue(createFakeLoginUser({ is_active: false }) as never);
        vi.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

        await expect(
            mockAuthService.login({ identifier: 'farhan', password: 'rahasia123' })
        ).rejects.toThrow(new AppError('Akun sudah tidak aktif, silahkan hubungi admin', 403));
    });
});

describe('AuthService.validateActivationToken', () => {
    it('mengembalikan record token jika token valid', async () => {
        const fakeToken = createFakeUserToken();
        mockDB.userToken.findUnique.mockResolvedValue(fakeToken);

        const data = await mockAuthService.validateActivationToken('plain-token');

        expect(mockDB.userToken.findUnique).toHaveBeenCalledWith({
            where: { token_hash: tokenUtils.hashToken('plain-token') },
        });
        expect(data).toEqual(fakeToken);
    });

    it('melempar AppError 401 jika token tidak ditemukan', async () => {
        mockDB.userToken.findUnique.mockResolvedValue(null);

        await expect(mockAuthService.validateActivationToken('token-salah')).rejects.toThrow(
            new AppError('Token tidak valid', 401)
        );
    });

    it('melempar AppError 401 jika token sudah pernah dipakai', async () => {
        mockDB.userToken.findUnique.mockResolvedValue(
            createFakeUserToken({ used_at: new Date('2026-01-01T01:00:00Z') })
        );

        await expect(mockAuthService.validateActivationToken('plain-token')).rejects.toThrow(
            new AppError('Token sudah pernah dipakai', 401)
        );
    });

    it('melempar AppError 401 jika token sudah expired', async () => {
        mockDB.userToken.findUnique.mockResolvedValue(
            createFakeUserToken({ expired_at: new Date(Date.now() - 1000) })
        );

        await expect(mockAuthService.validateActivationToken('plain-token')).rejects.toThrow(
            new AppError('Token sudah expired', 401)
        );
    });
});

describe('AuthService.activateAccount', () => {
    it('mengaktifkan akun dengan memanggil completeActivation', async () => {
        const fakeToken = createFakeUserToken();
        mockDB.userToken.findUnique.mockResolvedValue(fakeToken);

        await mockAuthService.activateAccount('plain-token', 'passwordbaru123');

        expect(mockUsersService.completeActivation).toHaveBeenCalledWith(userId, 'passwordbaru123', fakeToken.id);
    });
});

describe('AuthService.logout', () => {
    it('mencabut session berdasarkan token', async () => {
        await mockAuthService.logout('jwt-token-mock');

        expect(mockSessionService.revokeSession).toHaveBeenCalledWith('jwt-token-mock');
    });
});

describe('AuthService.forgotPassword', () => {
    it('membuat reset token dan mengirim email reset password', async () => {
        const fakeUser = createFakePublicUser();
        mockUsersService.getByEmail.mockResolvedValue(fakeUser);
        mockSettingService.getAll.mockResolvedValue({ app_name: 'LaporOB', company_name: 'PT WGS', logo_url: null });
        const sendRenderedEmailSpy = vi.spyOn(emailUtils, 'sendRenderedEmail').mockResolvedValue(undefined as never);

        await mockAuthService.forgotPassword('farhan@gmail.com');

        expect(mockUsersService.createPasswordResetToken).toHaveBeenCalledWith(
            userId,
            expect.any(String),
            expect.any(Date)
        );
        expect(sendRenderedEmailSpy).toHaveBeenCalledWith(
            mockEmailService,
            fakeUser.email,
            expect.stringContaining('Reset Password'),
            'reset-password',
            expect.objectContaining({ resetUrl: expect.stringContaining('/reset-password?token=') })
        );
    });

    it('melempar AppError 404 jika email tidak terdaftar', async () => {
        mockUsersService.getByEmail.mockResolvedValue(null);

        await expect(mockAuthService.forgotPassword('tidakada@gmail.com')).rejects.toThrow(
            new AppError('Email tidak terdaftar', 404)
        );
    });
});

describe('AuthService.resetPassword', () => {
    it('berhasil mereset password jika token reset valid', async () => {
        mockDB.userToken.findUnique.mockResolvedValue(
            createFakeUserToken({ type: 'reset_password' })
        );
        vi.spyOn(bcrypt, 'hash').mockResolvedValue('hashed_baru' as never);

        await mockAuthService.resetPassword('plain-token', 'passwordbaru123');

        expect(mockUsersService.resetUserPassword).toHaveBeenCalledWith(userId, 'hashed_baru', 'b7c8d9e0-1f2a-4b3c-9d4e-5f6a7b8c9d0e');
    });

    it('melempar AppError 401 jika token tidak valid atau bukan reset_password', async () => {
        mockDB.userToken.findUnique.mockResolvedValue(
            createFakeUserToken({ type: 'activation' })
        );

        await expect(mockAuthService.resetPassword('plain-token', 'passwordbaru123')).rejects.toThrow(
            new AppError('Token tidak valid', 401)
        );
    });

    it('melempar AppError 401 jika token sudah pernah digunakan', async () => {
        mockDB.userToken.findUnique.mockResolvedValue(
            createFakeUserToken({ type: 'reset_password', used_at: new Date() })
        );

        await expect(mockAuthService.resetPassword('plain-token', 'passwordbaru123')).rejects.toThrow(
            new AppError('Token sudah pernah digunakan', 401)
        );
    });

    it('melempar AppError 401 jika token sudah expired', async () => {
        mockDB.userToken.findUnique.mockResolvedValue(
            createFakeUserToken({ type: 'reset_password', expired_at: new Date(Date.now() - 1000) })
        );

        await expect(mockAuthService.resetPassword('plain-token', 'passwordbaru123')).rejects.toThrow(
            new AppError('Token sudah expired', 401)
        );
    });
});

describe('AuthService.changePassword', () => {
    it('berhasil mengubah password dan mengirim email notifikasi', async () => {
        mockUsersService.getUserWithPasswordById.mockResolvedValue({
            ...createFakePublicUser(),
            password: 'hashedlama',
        } as never);
        vi.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
        vi.spyOn(bcrypt, 'hash').mockResolvedValue('hashed_baru' as never);
        mockSettingService.getAll.mockResolvedValue({ app_name: 'LaporOB', company_name: 'PT WGS', logo_url: null });
        const sendRenderedEmailSpy = vi.spyOn(emailUtils, 'sendRenderedEmail').mockResolvedValue(undefined as never);

        await mockAuthService.changePassword(userId, {
            oldPassword: 'lamapassword',
            newPassword: 'barupassword123',
            confirmNewPassword: 'barupassword123',
        });

        expect(mockUsersService.resetUserPassword).toHaveBeenCalledWith(userId, 'hashed_baru', null);
        expect(sendRenderedEmailSpy).toHaveBeenCalledWith(
            mockEmailService,
            'farhan@gmail.com',
            expect.stringContaining('Berhasil Diubah'),
            'password-changed',
            expect.objectContaining({ userName: 'farhan' })
        );
    });

    it('melempar AppError 404 jika user tidak ditemukan', async () => {
        mockUsersService.getUserWithPasswordById.mockResolvedValue(null);

        await expect(
            mockAuthService.changePassword(userId, {
                oldPassword: 'lama',
                newPassword: 'baru12345',
                confirmNewPassword: 'baru12345',
            })
        ).rejects.toThrow(new AppError('User tidak ditemukan', 404));
    });

    it('melempar AppError 400 jika password lama salah', async () => {
        mockUsersService.getUserWithPasswordById.mockResolvedValue({
            ...createFakePublicUser(),
            password: 'hashedlama',
        } as never);
        vi.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

        await expect(
            mockAuthService.changePassword(userId, {
                oldPassword: 'salah',
                newPassword: 'baru12345',
                confirmNewPassword: 'baru12345',
            })
        ).rejects.toThrow(new AppError('Password lama salah', 400));
    });
});
