import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";
import type { Request, Response } from "express";
import { UsersController } from "../../../controllers/users_controller";
import type { IUsersService } from "../../../services/users_service.interface";
import type { IProfileService } from "../../../services/profile_service.interface";
import type { IKaryawanService } from "../../../services/karyawan_service.interface";
import type { ILaporanService } from "../../../services/laporan_service.interface";
import type { IStorageService } from "../../../services/storage_service.interface";
import type { PaginatedResponse } from "../../../types/response";
import type { PublicUser } from "../../../types/users";
import type { Role } from "../../../generated/prisma/client";
import type { UserDetailWithPenugasan } from "../../../repositories/users_repository.interface";
import { AppError } from "../../../utils/error";

const mockUsersService = mockDeep<IUsersService>();
const mockProfileService = mockDeep<IProfileService>();
const mockKaryawanService = mockDeep<IKaryawanService>();
const mockLaporanService = mockDeep<ILaporanService>();
const mockStorageService = mockDeep<IStorageService>();

const usersController = new UsersController(
    mockUsersService,
    mockProfileService,
    mockKaryawanService,
    mockLaporanService,
    mockStorageService
);

beforeEach(() => {
    mockReset(mockUsersService);
    mockReset(mockProfileService);
    mockReset(mockKaryawanService);
    mockReset(mockLaporanService);
    mockReset(mockStorageService);
});

const mockServiceResponse: PaginatedResponse<PublicUser> = {
    items: [],
    next_cursor: null,
    meta: {
        total_items: 0,
        current_page: 1,
        limit: 10,
        total_pages: 0,
    },
};

// Fake req/res express.
function createFakeReq(overrides?: {
    query?: Record<string, unknown>;
    params?: Record<string, string>;
    body?: Record<string, unknown>;
    user?: { id: string; username: string; role: string };
    files?: unknown[];
}) {
    return { query: {}, params: {}, ...overrides } as unknown as Request;
}

function createSuccessfullRes() {
    return {
        success: true,
        message: expect.any(String),
        data: mockServiceResponse,
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

describe('UsersController.getAll', () => {
    it('mengembalikan data semua user dengan response 200', async () => {
        mockUsersService.getAll.mockResolvedValue(mockServiceResponse);

        const res = createFakeRes();
        await usersController.getAll(createFakeReq(), res);

        expect(mockUsersService.getAll).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(createSuccessfullRes());
    });

    it('meneruskan page, limit, dan query hasil validasi ke service', async () => {
        mockUsersService.getAll.mockResolvedValue(mockServiceResponse);

        const res = createFakeRes();
        await usersController.getAll(
            createFakeReq({
                query: {
                    page: '2',
                    limit: '5',
                    search: 'farhan',
                    role_id: '852a6e0e-1bcf-4578-b93b-46f893544bfc',
                },
            }),
            res
        );

        expect(mockUsersService.getAll).toHaveBeenCalledWith(2, 5, {
            search: 'farhan',
            role_id: '852a6e0e-1bcf-4578-b93b-46f893544bfc',
        });
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('memakai default page 1 dan limit 10 jika query kosong', async () => {
        mockUsersService.getAll.mockResolvedValue(mockServiceResponse);

        const res = createFakeRes();
        await usersController.getAll(createFakeReq(), res);

        expect(mockUsersService.getAll).toHaveBeenCalledWith(1, 10, {
            search: null,
            role_id: null,
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(createSuccessfullRes())
    });

    it('mengembalikan 400 dan tidak memanggil service jika query tidak valid', async () => {
        const res = createFakeRes();
        await usersController.getAll(createFakeReq({ query: { role_id: 'bukan-uuid' } }), res);

        expect(mockUsersService.getAll).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            createFailedRes({ errorMsg: { "role_id": ["Format role_id harus UUID yang valid"]}} )
        );
    });


    it('meneruskan status code AppError dari service', async () => {
        mockUsersService.getAll.mockRejectedValue(new AppError('Gagal mengambil data user', 422));

        const res = createFakeRes();
        await usersController.getAll(createFakeReq(), res);

        expect(res.status).toHaveBeenCalledWith(422);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });

    it('mengembalikan 500 jika terjadi error yang tidak terduga', async () => {
        mockUsersService.getAll.mockRejectedValue(new Error('boom'));

        const res = createFakeRes();
        await usersController.getAll(createFakeReq(), res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });
});

const ROLE_ID_ADMIN = 'a1a1a1a1-1111-4111-8111-111111111111';
const ROLE_ID_HR = 'b2b2b2b2-2222-4222-8222-222222222222';
const ROLE_ID_OB = 'c3c3c3c3-3333-4333-8333-333333333333';
const ROLE_ID_KARYAWAN = 'd4d4d4d4-4444-4444-8444-444444444444';
const USER_ID = 'e5e5e5e5-5555-4555-8555-555555555555';

const fakeNow = new Date('2026-01-01T00:00:00Z');

function createFakeRole(id: string, nama_role: string): Role {
    return { id, nama_role, created_at: fakeNow };
}

function createFakeUserDetail(nama_role: string, overrides?: Partial<UserDetailWithPenugasan>): UserDetailWithPenugasan {
    return {
        id: USER_ID,
        username: 'farhan',
        email: 'farhan@gmail.com',
        nama_lengkap: 'Farhan',
        profile_picture: null,
        role_id: ROLE_ID_OB,
        is_active: true,
        is_deleted: false,
        created_at: fakeNow,
        updated_at: fakeNow,
        role: { nama_role },
        tokens: [],
        penugasan: [],
        ...overrides,
    };
}

function createHrReq(overrides?: { params?: Record<string, string>; body?: Record<string, unknown> }) {
    return createFakeReq({ ...overrides, user: { id: 'hr-1', username: 'hr1', role: 'hr' } });
}

function createAdminReq(overrides?: { params?: Record<string, string>; body?: Record<string, unknown> }) {
    return createFakeReq({ ...overrides, user: { id: 'admin-1', username: 'admin1', role: 'admin' } });
}

const validCreateBody = {
    nama_lengkap: 'Farhan Baru',
    username: 'farhanbaru',
    email: 'farhanbaru@gmail.com',
};

describe('UsersController.create - guard HR', () => {
    it('HR tidak boleh membuat user dengan role admin, response 403 dan service tidak dipanggil', async () => {
        mockUsersService.getRoles.mockResolvedValue([createFakeRole(ROLE_ID_ADMIN, 'admin')]);

        const res = createFakeRes();
        await usersController.create(
            createHrReq({ body: { ...validCreateBody, role_id: ROLE_ID_ADMIN } }),
            res
        );

        expect(mockUsersService.create).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });

    it('HR tidak boleh membuat user dengan role hr, response 403 dan service tidak dipanggil', async () => {
        mockUsersService.getRoles.mockResolvedValue([createFakeRole(ROLE_ID_HR, 'hr')]);

        const res = createFakeRes();
        await usersController.create(
            createHrReq({ body: { ...validCreateBody, role_id: ROLE_ID_HR } }),
            res
        );

        expect(mockUsersService.create).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
    });

    it('HR boleh membuat user dengan role ob, response 201', async () => {
        mockUsersService.getRoles.mockResolvedValue([createFakeRole(ROLE_ID_OB, 'ob')]);
        mockUsersService.create.mockResolvedValue({ id: USER_ID });

        const res = createFakeRes();
        await usersController.create(
            createHrReq({ body: { ...validCreateBody, role_id: ROLE_ID_OB } }),
            res
        );

        expect(mockUsersService.create).toHaveBeenCalledTimes(1);
        expect(mockUsersService.create).toHaveBeenCalledWith(
            expect.objectContaining({ ...validCreateBody, role_id: ROLE_ID_OB })
        );
        expect(res.status).toHaveBeenCalledWith(201);
    });

    it('admin tetap boleh membuat user dengan role admin, response 201', async () => {
        mockUsersService.create.mockResolvedValue({ id: USER_ID });

        const res = createFakeRes();
        await usersController.create(
            createAdminReq({ body: { ...validCreateBody, role_id: ROLE_ID_ADMIN } }),
            res
        );

        expect(mockUsersService.getRoles).not.toHaveBeenCalled();
        expect(mockUsersService.create).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(201);
    });
});

describe('UsersController.update - guard HR', () => {
    it('HR tidak boleh mengubah user dengan role hr, response 403 dan service tidak dipanggil', async () => {
        mockUsersService.getByID.mockResolvedValue(createFakeUserDetail('hr'));

        const res = createFakeRes();
        await usersController.update(
            createHrReq({ params: { user_id: USER_ID }, body: { nama_lengkap: 'Farhan Update' } }),
            res
        );

        expect(mockUsersService.update).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
    });

    it('HR tidak boleh mengubah user dengan role admin, response 403', async () => {
        mockUsersService.getByID.mockResolvedValue(createFakeUserDetail('admin'));

        const res = createFakeRes();
        await usersController.update(
            createHrReq({ params: { user_id: USER_ID }, body: { nama_lengkap: 'Farhan Update' } }),
            res
        );

        expect(mockUsersService.update).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
    });

    it('HR tidak boleh menaikkan role user menjadi hr, response 403', async () => {
        mockUsersService.getByID.mockResolvedValue(createFakeUserDetail('karyawan'));
        mockUsersService.getRoles.mockResolvedValue([createFakeRole(ROLE_ID_HR, 'hr')]);

        const res = createFakeRes();
        await usersController.update(
            createHrReq({ params: { user_id: USER_ID }, body: { role_id: ROLE_ID_HR } }),
            res
        );

        expect(mockUsersService.update).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
    });

    it('HR boleh mengubah user dengan role karyawan, response 200', async () => {
        mockUsersService.getByID.mockResolvedValue(createFakeUserDetail('karyawan'));

        const res = createFakeRes();
        await usersController.update(
            createHrReq({ params: { user_id: USER_ID }, body: { nama_lengkap: 'Farhan Update' } }),
            res
        );

        expect(mockUsersService.getRoles).not.toHaveBeenCalled();
        expect(mockUsersService.update).toHaveBeenCalledTimes(1);
        expect(mockUsersService.update).toHaveBeenCalledWith(
            USER_ID,
            expect.objectContaining({ nama_lengkap: 'Farhan Update' })
        );
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('admin tetap boleh mengubah user dengan role admin, response 200', async () => {
        mockUsersService.getByID.mockResolvedValue(createFakeUserDetail('admin'));

        const res = createFakeRes();
        await usersController.update(
            createAdminReq({ params: { user_id: USER_ID }, body: { nama_lengkap: 'Farhan Update' } }),
            res
        );

        expect(mockUsersService.update).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(200);
    });
});

describe('UsersController.delete - guard HR', () => {
    it('HR tidak boleh menghapus user dengan role admin, response 403 dan service tidak dipanggil', async () => {
        mockUsersService.getByID.mockResolvedValue(createFakeUserDetail('admin'));

        const res = createFakeRes();
        await usersController.delete(createHrReq({ params: { user_id: USER_ID } }), res);

        expect(mockUsersService.delete).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
    });

    it('HR tidak boleh menghapus user dengan role hr, response 403', async () => {
        mockUsersService.getByID.mockResolvedValue(createFakeUserDetail('hr'));

        const res = createFakeRes();
        await usersController.delete(createHrReq({ params: { user_id: USER_ID } }), res);

        expect(mockUsersService.delete).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
    });

    it('HR boleh menghapus user dengan role ob, response 200', async () => {
        mockUsersService.getByID.mockResolvedValue(createFakeUserDetail('ob'));

        const res = createFakeRes();
        await usersController.delete(createHrReq({ params: { user_id: USER_ID } }), res);

        expect(mockUsersService.delete).toHaveBeenCalledWith(USER_ID);
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('admin tetap boleh menghapus user dengan role admin, response 200', async () => {
        const res = createFakeRes();
        await usersController.delete(createAdminReq({ params: { user_id: USER_ID } }), res);

        expect(mockUsersService.getByID).not.toHaveBeenCalled();
        expect(mockUsersService.delete).toHaveBeenCalledWith(USER_ID);
        expect(res.status).toHaveBeenCalledWith(200);
    });
});

describe('UsersController.renewActivationToken - guard HR', () => {
    it('HR tidak boleh memperbarui token aktivasi user dengan role admin, response 403', async () => {
        mockUsersService.getByID.mockResolvedValue(createFakeUserDetail('admin'));

        const res = createFakeRes();
        await usersController.renewActivationToken(createHrReq({ params: { user_id: USER_ID } }), res);

        expect(mockUsersService.renewActivationToken).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
    });

    it('HR boleh memperbarui token aktivasi user dengan role ob, response 200', async () => {
        mockUsersService.getByID.mockResolvedValue(createFakeUserDetail('ob'));

        const res = createFakeRes();
        await usersController.renewActivationToken(createHrReq({ params: { user_id: USER_ID } }), res);

        expect(mockUsersService.renewActivationToken).toHaveBeenCalledWith(USER_ID);
        expect(res.status).toHaveBeenCalledWith(200);
    });
});

describe('UsersController.updateProfile - regresi guard HR', () => {
    it('HR tetap bisa mengubah profil sendiri, response 200', async () => {
        mockUsersService.getByID.mockResolvedValue(createFakeUserDetail('hr'));

        const res = createFakeRes();
        await usersController.updateProfile(createHrReq({ body: { nama_lengkap: 'Farhan Sendiri' } }), res);

        expect(mockUsersService.update).toHaveBeenCalledWith(
            'hr-1',
            expect.objectContaining({ nama_lengkap: 'Farhan Sendiri' })
        );
        expect(res.status).toHaveBeenCalledWith(200);
    });
});
