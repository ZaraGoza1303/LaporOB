import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";
import type { Request, Response } from "express";
import { AuthController } from "../../../controllers/auth_controller";
import type { IAuthService } from "../../../services/auth_service.interface";
import { AppError } from "../../../utils/error";

const mockAuthService = mockDeep<IAuthService>();

const authController = new AuthController(mockAuthService);

beforeEach(() => {
    mockReset(mockAuthService);
});

// Fake req/res express.
function createFakeReq(overrides?: {
    query?: Record<string, unknown>;
    params?: Record<string, string>;
    body?: Record<string, unknown>;
    headers?: Record<string, string>;
    ip?: string;
    user?: { id: string; username: string; role: string };
}) {
    return {
        query: {},
        params: {},
        body: {},
        headers: {},
        socket: {},
        ...overrides,
    } as unknown as Request;
}

function createSuccessfullRes(data?: unknown) {
    return {
        success: true,
        message: expect.any(String),
        data: data,
    }
}

function createFailedRes(payload?: { errorMsg: Record<string, Array<string>> }) {
    return {
        errors: payload?.errorMsg,
        success: false,
        message: expect.any(String),
    }
}

function createFakeRes() {
    return {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
    } as unknown as Response;
}

describe('AuthController.login', () => {
    it('mengembalikan jwt token dengan response 200', async () => {
        mockAuthService.login.mockResolvedValue({ jwt_token: 'jwt-token-mock' });

        const res = createFakeRes();
        await authController.login(
            createFakeReq({ body: { identifier: 'farhan', password: 'rahasia123' } }),
            res
        );

        expect(mockAuthService.login).toHaveBeenCalledWith(
            { identifier: 'farhan', password: 'rahasia123' },
            null,
            null
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(createSuccessfullRes({ jwt_token: 'jwt-token-mock' }));
    });

    it('mengembalikan 400 dan tidak memanggil service jika body tidak valid', async () => {
        const res = createFakeRes();
        await authController.login(createFakeReq({ body: { identifier: '', password: '' } }), res);

        expect(mockAuthService.login).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            createFailedRes({ errorMsg: { "identifier": ["email atau username required"], "password": ["password required"] } })
        );
    });

    it('mengembalikan 400 dan tidak memanggil service jika request body kosong', async () => {
        const res = createFakeRes();
        await authController.login(createFakeReq({ body: undefined }), res);

        expect(mockAuthService.login).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });

    it('meneruskan status code AppError dari service', async () => {
        mockAuthService.login.mockRejectedValue(new AppError('Email/Username atau password salah!', 401));

        const res = createFakeRes();
        await authController.login(
            createFakeReq({ body: { identifier: 'farhan', password: 'salah' } }),
            res
        );

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });

    it('mengembalikan 500 jika terjadi error yang tidak terduga', async () => {
        mockAuthService.login.mockRejectedValue(new Error('boom'));

        const res = createFakeRes();
        await authController.login(
            createFakeReq({ body: { identifier: 'farhan', password: 'rahasia123' } }),
            res
        );

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });
});

describe('AuthController.verifyActivation', () => {
    it('mengembalikan response 200 jika token valid', async () => {
        mockAuthService.validateActivationToken.mockResolvedValue({} as never);

        const res = createFakeRes();
        await authController.verifyActivation(createFakeReq({ query: { token: 'plain-token' } }), res);

        expect(mockAuthService.validateActivationToken).toHaveBeenCalledWith('plain-token');
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('mengembalikan 400 dan tidak memanggil service jika token kosong', async () => {
        const res = createFakeRes();
        await authController.verifyActivation(createFakeReq({ query: { token: '' } }), res);

        expect(mockAuthService.validateActivationToken).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            createFailedRes({ errorMsg: { "token": ["Token wajib diisi"] } })
        );
    });

    it('meneruskan status code AppError dari service', async () => {
        mockAuthService.validateActivationToken.mockRejectedValue(new AppError('Token sudah expired', 401));

        const res = createFakeRes();
        await authController.verifyActivation(createFakeReq({ query: { token: 'expired' } }), res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });

    it('mengembalikan 400 jika terjadi error yang tidak terduga', async () => {
        mockAuthService.validateActivationToken.mockRejectedValue(new Error('boom'));

        const res = createFakeRes();
        await authController.verifyActivation(createFakeReq({ query: { token: 'plain-token' } }), res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });
});

describe('AuthController.activateAccount', () => {
    it('mengembalikan response 200 setelah berhasil aktivasi', async () => {
        mockAuthService.activateAccount.mockResolvedValue(undefined);

        const res = createFakeRes();
        await authController.activateAccount(
            createFakeReq({
                query: { token: 'plain-token' },
                body: { password: 'baru12345', confirmPassword: 'baru12345' },
            }),
            res
        );

        expect(mockAuthService.activateAccount).toHaveBeenCalledWith('plain-token', 'baru12345');
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('mengembalikan 400 dan tidak memanggil service jika token kosong', async () => {
        const res = createFakeRes();
        await authController.activateAccount(
            createFakeReq({
                query: { token: '' },
                body: { password: 'baru12345', confirmPassword: 'baru12345' },
            }),
            res
        );

        expect(mockAuthService.activateAccount).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('mengembalikan 400 dan tidak memanggil service jika password tidak cocok', async () => {
        const res = createFakeRes();
        await authController.activateAccount(
            createFakeReq({
                query: { token: 'plain-token' },
                body: { password: 'baru12345', confirmPassword: 'beda12345' },
            }),
            res
        );

        expect(mockAuthService.activateAccount).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('mengembalikan 400 jika aktivasi gagal tanpa AppError', async () => {
        mockAuthService.activateAccount.mockRejectedValue(new Error('boom'));

        const res = createFakeRes();
        await authController.activateAccount(
            createFakeReq({
                query: { token: 'plain-token' },
                body: { password: 'baru12345', confirmPassword: 'baru12345' },
            }),
            res
        );

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });
});

describe('AuthController.logout', () => {
    it('mengembalikan response 200 setelah berhasil logout', async () => {
        mockAuthService.logout.mockResolvedValue(undefined);

        const res = createFakeRes();
        await authController.logout(
            createFakeReq({ headers: { authorization: 'Bearer jwt-token-mock' } }),
            res
        );

        expect(mockAuthService.logout).toHaveBeenCalledWith('jwt-token-mock');
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('mengembalikan 400 dan tidak memanggil service jika token tidak ada', async () => {
        const res = createFakeRes();
        await authController.logout(createFakeReq({ headers: {} }), res);

        expect(mockAuthService.logout).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('mengembalikan 500 jika terjadi error yang tidak terduga', async () => {
        mockAuthService.logout.mockRejectedValue(new Error('boom'));

        const res = createFakeRes();
        await authController.logout(
            createFakeReq({ headers: { authorization: 'Bearer jwt-token-mock' } }),
            res
        );

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });
});

describe('AuthController.forgotPassword', () => {
    it('mengembalikan response 200 setelah link reset dikirim', async () => {
        mockAuthService.forgotPassword.mockResolvedValue(undefined);

        const res = createFakeRes();
        await authController.forgotPassword(
            createFakeReq({ body: { email: 'farhan@gmail.com' } }),
            res
        );

        expect(mockAuthService.forgotPassword).toHaveBeenCalledWith('farhan@gmail.com');
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('mengembalikan 400 dan tidak memanggil service jika email tidak valid', async () => {
        const res = createFakeRes();
        await authController.forgotPassword(createFakeReq({ body: { email: 'bukan-email' } }), res);

        expect(mockAuthService.forgotPassword).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            createFailedRes({ errorMsg: { "email": ["Format email tidak valid"] } })
        );
    });

    it('meneruskan status code AppError dari service', async () => {
        mockAuthService.forgotPassword.mockRejectedValue(new AppError('Email tidak terdaftar', 404));

        const res = createFakeRes();
        await authController.forgotPassword(
            createFakeReq({ body: { email: 'tidakada@gmail.com' } }),
            res
        );

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });

    it('mengembalikan 500 jika terjadi error yang tidak terduga', async () => {
        mockAuthService.forgotPassword.mockRejectedValue(new Error('boom'));

        const res = createFakeRes();
        await authController.forgotPassword(
            createFakeReq({ body: { email: 'farhan@gmail.com' } }),
            res
        );

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });
});

describe('AuthController.resetPassword', () => {
    it('mengembalikan response 200 setelah password direset', async () => {
        mockAuthService.resetPassword.mockResolvedValue(undefined);

        const res = createFakeRes();
        await authController.resetPassword(
            createFakeReq({
                query: { token: 'plain-token' },
                body: { password: 'baru12345', confirmPassword: 'baru12345' },
            }),
            res
        );

        expect(mockAuthService.resetPassword).toHaveBeenCalledWith('plain-token', 'baru12345');
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('mengembalikan 400 dan tidak memanggil service jika token kosong', async () => {
        const res = createFakeRes();
        await authController.resetPassword(
            createFakeReq({
                query: { token: '' },
                body: { password: 'baru12345', confirmPassword: 'baru12345' },
            }),
            res
        );

        expect(mockAuthService.resetPassword).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('mengembalikan 500 jika terjadi error yang tidak terduga', async () => {
        mockAuthService.resetPassword.mockRejectedValue(new Error('boom'));

        const res = createFakeRes();
        await authController.resetPassword(
            createFakeReq({
                query: { token: 'plain-token' },
                body: { password: 'baru12345', confirmPassword: 'baru12345' },
            }),
            res
        );

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });
});

describe('AuthController.changePassword', () => {
    it('mengembalikan response 200 setelah password diubah', async () => {
        mockAuthService.changePassword.mockResolvedValue(undefined);

        const res = createFakeRes();
        await authController.changePassword(
            createFakeReq({
                user: { id: 'e2fbdc6f-ec0d-4547-a51d-a81b69741ed2', username: 'farhan', role: 'ob' },
                body: { oldPassword: 'lama123', newPassword: 'baru12345', confirmNewPassword: 'baru12345' },
            }),
            res
        );

        expect(mockAuthService.changePassword).toHaveBeenCalledWith(
            'e2fbdc6f-ec0d-4547-a51d-a81b69741ed2',
            { oldPassword: 'lama123', newPassword: 'baru12345', confirmNewPassword: 'baru12345' }
        );
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('mengembalikan 401 dan tidak memanggil service jika user tidak terautentikasi', async () => {
        const res = createFakeRes();
        await authController.changePassword(
            createFakeReq({
                body: { oldPassword: 'lama123', newPassword: 'baru12345', confirmNewPassword: 'baru12345' },
            }),
            res
        );

        expect(mockAuthService.changePassword).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });

    it('mengembalikan 400 dan tidak memanggil service jika body tidak valid', async () => {
        const res = createFakeRes();
        await authController.changePassword(
            createFakeReq({
                user: { id: 'e2fbdc6f-ec0d-4547-a51d-a81b69741ed2', username: 'farhan', role: 'ob' },
                body: { oldPassword: '', newPassword: 'baru12345', confirmNewPassword: 'baru12345' },
            }),
            res
        );

        expect(mockAuthService.changePassword).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            createFailedRes({ errorMsg: { "oldPassword": ["Password lama wajib diisi"] } })
        );
    });

    it('mengembalikan 500 jika terjadi error yang tidak terduga', async () => {
        mockAuthService.changePassword.mockRejectedValue(new Error('boom'));

        const res = createFakeRes();
        await authController.changePassword(
            createFakeReq({
                user: { id: 'e2fbdc6f-ec0d-4547-a51d-a81b69741ed2', username: 'farhan', role: 'ob' },
                body: { oldPassword: 'lama123', newPassword: 'baru12345', confirmNewPassword: 'baru12345' },
            }),
            res
        );

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });
});
