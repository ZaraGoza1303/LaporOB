import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";
import type { Request, Response } from "express";
import { AdminController } from "../../../controllers/admin_controller";
import type { IAdminService } from "../../../services/admin_service.interface";
import type { IChecklistHarianService } from "../../../services/checklistHarian_service.interface";
import type { ITugasService } from "../../../services/tugas_service.interface";
import type { ISkillService } from "../../../services/skill_service.interface";
import { AppError } from "../../../utils/error";

const mockAdminService = mockDeep<IAdminService>();
const mockChecklistService = mockDeep<IChecklistHarianService>();
const mockTugasService = mockDeep<ITugasService>();
const mockSkillService = mockDeep<ISkillService>();

const adminController = new AdminController(
    mockAdminService,
    mockChecklistService,
    mockTugasService,
    mockSkillService
);

beforeEach(() => {
    mockReset(mockAdminService);
    mockReset(mockChecklistService);
    mockReset(mockTugasService);
    mockReset(mockSkillService);
});

const laporanId = '3f2a1b7c-9d4e-4a51-8c6f-1d2e3f4a5b6c';

// Fake req/res express.
function createFakeReq(overrides?: {
    query?: Record<string, unknown>;
    params?: Record<string, string>;
    body?: Record<string, unknown>;
}) {
    return { query: {}, params: {}, body: {}, ...overrides } as unknown as Request;
}

function createSuccessfullRes(data?: unknown) {
    return {
        success: true,
        message: expect.any(String),
        data: data,
    }
}

function createFailedRes() {
    return {
        errors: undefined,
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

describe('AdminController.getAllLaporan', () => {
    it('mengembalikan daftar laporan dengan response 200', async () => {
        const fakeResponse = { laporan: { items: [] } };
        mockAdminService.getAllLaporan.mockResolvedValue(fakeResponse as never);

        const res = createFakeRes();
        await adminController.getAllLaporan(createFakeReq({ query: { page: '1', limit: '10' } }), res);

        expect(mockAdminService.getAllLaporan).toHaveBeenCalledWith(1, 10, expect.any(Object));
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(createSuccessfullRes(fakeResponse));
    });

    it('mengembalikan 400 dan tidak memanggil service jika query tidak valid', async () => {
        const res = createFakeRes();
        await adminController.getAllLaporan(
            createFakeReq({ query: { page: '1', status: 'STATUS_SALAH' } }),
            res
        );

        expect(mockAdminService.getAllLaporan).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('mengembalikan 500 jika terjadi error yang tidak terduga', async () => {
        mockAdminService.getAllLaporan.mockRejectedValue(new Error('boom'));

        const res = createFakeRes();
        await adminController.getAllLaporan(createFakeReq({ query: {} }), res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });
});

describe('AdminController.getReportDetail', () => {
    it('mengembalikan detail laporan dengan response 200', async () => {
        const fakeDetail = { id: laporanId };
        mockAdminService.getReportDetail.mockResolvedValue(fakeDetail as never);

        const res = createFakeRes();
        await adminController.getReportDetail(createFakeReq({ params: { laporan_id: laporanId } }), res);

        expect(mockAdminService.getReportDetail).toHaveBeenCalledWith(laporanId);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(createSuccessfullRes(fakeDetail));
    });

    it('mengembalikan 400 dan tidak memanggil service jika id bukan uuid', async () => {
        const res = createFakeRes();
        await adminController.getReportDetail(createFakeReq({ params: { laporan_id: 'bukan-uuid' } }), res);

        expect(mockAdminService.getReportDetail).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('meneruskan status code AppError dari service', async () => {
        mockAdminService.getReportDetail.mockRejectedValue(new AppError('Laporan tidak ditemukan', 404));

        const res = createFakeRes();
        await adminController.getReportDetail(createFakeReq({ params: { laporan_id: laporanId } }), res);

        expect(res.status).toHaveBeenCalledWith(404);
    });
});

describe('AdminController.approveLaporan', () => {
    it('menyetujui laporan dengan response 200', async () => {
        mockAdminService.approveLaporan.mockResolvedValue({ id: laporanId } as never);

        const res = createFakeRes();
        await adminController.approveLaporan(createFakeReq({ params: { laporan_id: laporanId }, body: {} }), res);

        expect(mockAdminService.approveLaporan).toHaveBeenCalledWith(laporanId, undefined);
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('mengembalikan 500 jika terjadi error yang tidak terduga', async () => {
        mockAdminService.approveLaporan.mockRejectedValue(new Error('boom'));

        const res = createFakeRes();
        await adminController.approveLaporan(createFakeReq({ params: { laporan_id: laporanId }, body: {} }), res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('AdminController.deleteLaporan', () => {
    it('menghapus laporan dengan response 200', async () => {
        mockAdminService.deleteLaporan.mockResolvedValue(undefined);

        const res = createFakeRes();
        await adminController.deleteLaporan(createFakeReq({ params: { laporan_id: laporanId } }), res);

        expect(mockAdminService.deleteLaporan).toHaveBeenCalledWith(laporanId);
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('mengembalikan 400 dan tidak memanggil service jika id bukan uuid', async () => {
        const res = createFakeRes();
        await adminController.deleteLaporan(createFakeReq({ params: { laporan_id: 'bukan-uuid' } }), res);

        expect(mockAdminService.deleteLaporan).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
    });
});
