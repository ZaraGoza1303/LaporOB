import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";
import type { Request, Response } from "express";
import { ObController } from "../../../controllers/ob_controller";
import type { IObService } from "../../../services/ob_service.interface";
import type { ITugasService } from "../../../services/tugas_service.interface";
import type { ILaporanService } from "../../../services/laporan_service.interface";
import type { IChecklistHarianService } from "../../../services/checklistHarian_service.interface";
import type { IStorageService } from "../../../services/storage_service.interface";
import { AppError } from "../../../utils/error";

const mockObService = mockDeep<IObService>();
const mockTugasService = mockDeep<ITugasService>();
const mockLaporanService = mockDeep<ILaporanService>();
const mockChecklistService = mockDeep<IChecklistHarianService>();
const mockStorageService = mockDeep<IStorageService>();

const obController = new ObController(
    mockObService,
    mockTugasService,
    mockLaporanService,
    mockChecklistService,
    mockStorageService
);

beforeEach(() => {
    mockReset(mockObService);
    mockReset(mockTugasService);
    mockReset(mockLaporanService);
    mockReset(mockChecklistService);
    mockReset(mockStorageService);
    vi.restoreAllMocks();
});

const obId = 'e2fbdc6f-ec0d-4547-a51d-a81b69741ed2';
const laporanId = '11111111-1111-4111-8111-111111111111';
const tugasId = '22222222-2222-4222-8222-222222222222';
const checklistId = '33333333-3333-4333-8333-333333333333';

// Fake req/res express.
function createFakeReq(overrides?: {
    params?: Record<string, string>;
    body?: Record<string, unknown>;
    files?: unknown[];
    user?: { id: string; username: string; role: string };
}) {
    return { params: {}, body: {}, files: [], ...overrides } as unknown as Request;
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

function createObReq(overrides?: { params?: Record<string, string>; body?: Record<string, unknown>; files?: unknown[] }) {
    return createFakeReq({ ...overrides, user: { id: obId, username: 'farhan_ob', role: 'ob' } });
}

describe('ObController.getHomeStats', () => {
    it('mengembalikan home ob dengan response 200', async () => {
        const fakeHome = { ob: { nama_lengkap: 'Farhan OB' }, laporan: [] };
        mockObService.getHomeStats.mockResolvedValue(fakeHome as never);

        const res = createFakeRes();
        await obController.getHomeStats(createObReq(), res);

        expect(mockObService.getHomeStats).toHaveBeenCalledWith(obId);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(createSuccessfullRes(fakeHome));
    });

    it('meneruskan status code AppError dari service', async () => {
        mockObService.getHomeStats.mockRejectedValue(new AppError('Gagal', 404));

        const res = createFakeRes();
        await obController.getHomeStats(createObReq(), res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });
});

describe('ObController.takeLapor', () => {
    it('mengambil laporan dengan response 200', async () => {
        mockLaporanService.ambilLaporan.mockResolvedValue(undefined);

        const res = createFakeRes();
        await obController.takeLapor(createObReq({ params: { laporan_id: laporanId } }), res);

        expect(mockLaporanService.ambilLaporan).toHaveBeenCalledWith(laporanId, obId);
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('mengembalikan 400 dan tidak memanggil service jika laporan_id bukan uuid', async () => {
        const res = createFakeRes();
        await obController.takeLapor(createObReq({ params: { laporan_id: 'bukan-uuid' } }), res);

        expect(mockLaporanService.ambilLaporan).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('meneruskan status code AppError dari service', async () => {
        mockLaporanService.ambilLaporan.mockRejectedValue(new AppError('Sudah diambil', 409));

        const res = createFakeRes();
        await obController.takeLapor(createObReq({ params: { laporan_id: laporanId } }), res);

        expect(res.status).toHaveBeenCalledWith(409);
    });
});

describe('ObController.claimChecklist', () => {
    it('mengklaim checklist dengan response 200', async () => {
        mockChecklistService.ambilChecklist.mockResolvedValue(undefined);

        const res = createFakeRes();
        await obController.claimChecklist(createObReq({ params: { checklist_id: checklistId } }), res);

        expect(mockChecklistService.ambilChecklist).toHaveBeenCalledWith(checklistId, obId);
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('mengembalikan 400 dan tidak memanggil service jika checklist_id bukan uuid', async () => {
        const res = createFakeRes();
        await obController.claimChecklist(createObReq({ params: { checklist_id: 'bukan-uuid' } }), res);

        expect(mockChecklistService.ambilChecklist).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
    });
});

describe('ObController.toggleKolaborasi', () => {
    it('mengubah status kolaborasi dengan response 200', async () => {
        mockLaporanService.toggleKolaborasiOpen.mockResolvedValue(undefined);

        const res = createFakeRes();
        await obController.toggleKolaborasi(
            createObReq({ params: { laporan_id: laporanId }, body: { is_open: true, catatan: 'butuh bantuan' } }),
            res
        );

        expect(mockLaporanService.toggleKolaborasiOpen).toHaveBeenCalledWith(laporanId, obId, true, 'butuh bantuan');
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('mengembalikan 400 dan tidak memanggil service jika body tidak valid', async () => {
        const res = createFakeRes();
        await obController.toggleKolaborasi(
            createObReq({ params: { laporan_id: laporanId }, body: { is_open: 'ya' } }),
            res
        );

        expect(mockLaporanService.toggleKolaborasiOpen).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
    });
});

describe('ObController.getReportDetail', () => {
    it('mengembalikan detail laporan dengan response 200', async () => {
        const fakeDetail = { id: laporanId };
        mockLaporanService.getReportDetail.mockResolvedValue(fakeDetail as never);

        const res = createFakeRes();
        await obController.getReportDetail(createObReq({ params: { laporan_id: laporanId } }), res);

        expect(mockLaporanService.getReportDetail).toHaveBeenCalledWith(laporanId, obId);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(createSuccessfullRes(fakeDetail));
    });

    it('mengembalikan 500 jika terjadi error yang tidak terduga', async () => {
        mockLaporanService.getReportDetail.mockRejectedValue(new Error('boom'));

        const res = createFakeRes();
        await obController.getReportDetail(createObReq({ params: { laporan_id: laporanId } }), res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('ObController.getTugas', () => {
    it('mengembalikan daftar tugas ob dengan response 200', async () => {
        const fakeTugas = [{ id: tugasId }];
        mockTugasService.getAllTugasForOb.mockResolvedValue(fakeTugas as never);

        const res = createFakeRes();
        await obController.getTugas(createObReq(), res);

        expect(mockTugasService.getAllTugasForOb).toHaveBeenCalledWith(obId);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(createSuccessfullRes(fakeTugas));
    });

    it('mengembalikan 500 jika terjadi error yang tidak terduga', async () => {
        mockTugasService.getAllTugasForOb.mockRejectedValue(new Error('boom'));

        const res = createFakeRes();
        await obController.getTugas(createObReq(), res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});
