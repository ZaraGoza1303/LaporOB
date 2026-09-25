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
function createFakeReq(overrides?: { query?: Record<string, unknown>; params?: Record<string, string> }) {
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
