import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";
import type { Request, Response } from "express";
import { ConstantsController } from "../../../controllers/constants_controller";
import type { IConstantsService, } from "../../../services/constants_service.interface";
import type { AppConstantsRes } from "../../../types/constants";

const mockConstantsService = mockDeep<IConstantsService>();

const constantsController = new ConstantsController(mockConstantsService);

beforeEach(() => {
    mockReset(mockConstantsService);
});

// Fungsi generate fake data dan bisa juga override
function createFakeConstants(overrides?: Partial<AppConstantsRes>): AppConstantsRes {
    return {
        hari: ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'],
        checklist_status: ['BELUM_DIKERJAKAN', 'SELESAI'],
        tugas_status: ['BELUM_DIKERJAKAN', 'SELESAI'],
        laporan_status: ['PENDING', 'SELESAI'],
        laporan_priority: ['URGENT', 'STANDARD'],
        kolaborasi_status: ['PENDING', 'APPROVED'],
        user_role: ['ob', 'hr', 'admin', 'karyawan'],
        ref_tipe: ['LAPORAN', 'SKILL'],
        ...overrides,
    } as AppConstantsRes;
}

// Fake req/res express.
function createFakeReq() {
    return {} as unknown as Request;
}

function createSuccessfullRes(data?: unknown) {
    return {
        success: true,
        message: expect.any(String),
        data: data,
    }
}

function createFakeRes() {
    return {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
    } as unknown as Response;
}

describe('ConstantsController.getConstants', () => {
    it('mengembalikan seluruh konstanta dengan response 200', async () => {
        const fakeConstants = createFakeConstants();
        mockConstantsService.getConstants.mockReturnValue(fakeConstants);

        const res = createFakeRes();
        await constantsController.getConstants(createFakeReq(), res);

        expect(mockConstantsService.getConstants).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(createSuccessfullRes(fakeConstants));
    });
});
