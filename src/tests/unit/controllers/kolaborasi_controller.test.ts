import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";
import type { Request, Response } from "express";
import { KolaborasiController } from "../../../controllers/kolaborasi_controller";
import type { IKolaborasiService } from "../../../services/kolaborasi_service.interface";
import { AppError } from "../../../utils/error";

const mockKolaborasiService = mockDeep<IKolaborasiService>();

const kolaborasiController = new KolaborasiController(mockKolaborasiService);

beforeEach(() => {
    mockReset(mockKolaborasiService);
});

const laporanId = 'e2fbdc6f-ec0d-4547-a51d-a81b69741ed2';
const kolaborasiId = '3f2a1b7c-9d4e-4a51-8c6f-1d2e3f4a5b6c';
const obId = '852a6e0e-1bcf-4578-b93b-46f893544bfc';

// Fake req/res express.
function createFakeReq(overrides?: {
    params?: Record<string, string>;
    user?: { id: string; username: string; role: string };
}) {
    return { params: {}, ...overrides } as unknown as Request;
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

function createObReq(params?: Record<string, string>) {
    return createFakeReq({ params, user: { id: obId, username: 'farhan_ob', role: 'ob' } });
}

describe('KolaborasiController.gabung', () => {
    it('mengembalikan response 201 setelah meminta gabung', async () => {
        const fakeResult = { id: kolaborasiId, laporan_id: laporanId, ob_id: obId, status: 'PENDING', created_at: new Date().toISOString() };
        mockKolaborasiService.gabung.mockResolvedValue(fakeResult as never);

        const res = createFakeRes();
        await kolaborasiController.gabung(createObReq({ laporan_id: laporanId }), res);

        expect(mockKolaborasiService.gabung).toHaveBeenCalledWith(laporanId, obId);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(createSuccessfullRes(fakeResult));
    });

    it('mengembalikan 400 dan tidak memanggil service jika laporan_id bukan uuid', async () => {
        const res = createFakeRes();
        await kolaborasiController.gabung(createObReq({ laporan_id: 'bukan-uuid' }), res);

        expect(mockKolaborasiService.gabung).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('meneruskan status code AppError dari service', async () => {
        mockKolaborasiService.gabung.mockRejectedValue(new AppError('Sudah tergabung', 409));

        const res = createFakeRes();
        await kolaborasiController.gabung(createObReq({ laporan_id: laporanId }), res);

        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });

    it('mengembalikan 500 jika terjadi error yang tidak terduga', async () => {
        mockKolaborasiService.gabung.mockRejectedValue(new Error('boom'));

        const res = createFakeRes();
        await kolaborasiController.gabung(createObReq({ laporan_id: laporanId }), res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });
});

describe('KolaborasiController.setujui', () => {
    it('mengembalikan response 200 setelah menyetujui', async () => {
        mockKolaborasiService.setujui.mockResolvedValue(undefined);

        const res = createFakeRes();
        await kolaborasiController.setujui(createObReq({ laporan_id: laporanId, kolaborasi_id: kolaborasiId }), res);

        expect(mockKolaborasiService.setujui).toHaveBeenCalledWith(kolaborasiId, laporanId, obId);
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('mengembalikan 400 dan tidak memanggil service jika params bukan uuid', async () => {
        const res = createFakeRes();
        await kolaborasiController.setujui(createObReq({ laporan_id: 'bukan-uuid', kolaborasi_id: kolaborasiId }), res);

        expect(mockKolaborasiService.setujui).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('mengembalikan 500 jika terjadi error yang tidak terduga', async () => {
        mockKolaborasiService.setujui.mockRejectedValue(new Error('boom'));

        const res = createFakeRes();
        await kolaborasiController.setujui(createObReq({ laporan_id: laporanId, kolaborasi_id: kolaborasiId }), res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('KolaborasiController.daftarRequest', () => {
    it('mengembalikan daftar permintaan dengan response 200', async () => {
        const fakeRequests = [{ id: kolaborasiId, status: 'PENDING' }];
        mockKolaborasiService.daftarRequest.mockResolvedValue(fakeRequests as never);

        const res = createFakeRes();
        await kolaborasiController.daftarRequest(createObReq({ laporan_id: laporanId }), res);

        expect(mockKolaborasiService.daftarRequest).toHaveBeenCalledWith(laporanId, obId);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(createSuccessfullRes(fakeRequests));
    });

    it('mengembalikan 500 jika terjadi error yang tidak terduga', async () => {
        mockKolaborasiService.daftarRequest.mockRejectedValue(new Error('boom'));

        const res = createFakeRes();
        await kolaborasiController.daftarRequest(createObReq({ laporan_id: laporanId }), res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('KolaborasiController.keluar', () => {
    it('mengembalikan response 200 setelah keluar', async () => {
        mockKolaborasiService.keluar.mockResolvedValue(undefined);

        const res = createFakeRes();
        await kolaborasiController.keluar(createObReq({ laporan_id: laporanId }), res);

        expect(mockKolaborasiService.keluar).toHaveBeenCalledWith(laporanId, obId);
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('meneruskan status code AppError dari service', async () => {
        mockKolaborasiService.keluar.mockRejectedValue(new AppError('Tidak tergabung', 404));

        const res = createFakeRes();
        await kolaborasiController.keluar(createObReq({ laporan_id: laporanId }), res);

        expect(res.status).toHaveBeenCalledWith(404);
    });
});
