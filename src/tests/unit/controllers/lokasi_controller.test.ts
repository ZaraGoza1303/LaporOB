import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";
import type { Request, Response } from "express";
import { LokasiController } from "../../../controllers/lokasi_controller";
import type { ILokasiService } from "../../../services/lokasi_service.interface";
import type { LokasiRes } from "../../../types/lokasi";
import { AppError } from "../../../utils/error";

const mockLokasiService = mockDeep<ILokasiService>();

const lokasiController = new LokasiController(mockLokasiService);

beforeEach(() => {
    mockReset(mockLokasiService);
});

const lokasiId = 'e2fbdc6f-ec0d-4547-a51d-a81b69741ed2';

// Fungsi generate fake data dan bisa juga override
function createFakeLokasi(overrides?: Partial<LokasiRes>): LokasiRes {
    return {
        id: lokasiId,
        nama_lokasi: 'Gedung WGS',
        alamat: 'Jl. Merdeka No. 1',
        jumlah_lantai: 2,
        lantai: [
            { id: '3f2a1b7c-9d4e-4a51-8c6f-1d2e3f4a5b6c', nomor_lantai: 1 },
            { id: 'f6e0481d-67d4-449b-b3dc-376e72bdcf28', nomor_lantai: 2 },
        ],
        created_at: new Date('2026-01-01T00:00:00Z'),
        updated_at: new Date('2026-01-01T00:00:00Z'),
        ...overrides,
    };
}

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

describe('LokasiController.getAll', () => {
    it('mengembalikan daftar lokasi dengan response 200', async () => {
        const fakeLokasi = [createFakeLokasi()];
        mockLokasiService.getAll.mockResolvedValue(fakeLokasi);

        const res = createFakeRes();
        await lokasiController.getAll(createFakeReq(), res);

        expect(mockLokasiService.getAll).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(createSuccessfullRes(fakeLokasi));
    });

    it('meneruskan status code AppError dari service', async () => {
        mockLokasiService.getAll.mockRejectedValue(new AppError('Gagal mengambil data', 422));

        const res = createFakeRes();
        await lokasiController.getAll(createFakeReq(), res);

        expect(res.status).toHaveBeenCalledWith(422);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });

    it('mengembalikan 500 jika terjadi error yang tidak terduga', async () => {
        mockLokasiService.getAll.mockRejectedValue(new Error('boom'));

        const res = createFakeRes();
        await lokasiController.getAll(createFakeReq(), res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });
});

describe('LokasiController.getByID', () => {
    it('mengembalikan detail lokasi dengan response 200', async () => {
        const fakeLokasi = createFakeLokasi();
        mockLokasiService.getByID.mockResolvedValue(fakeLokasi);

        const res = createFakeRes();
        await lokasiController.getByID(createFakeReq({ params: { lokasi_id: lokasiId } }), res);

        expect(mockLokasiService.getByID).toHaveBeenCalledWith(lokasiId);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(createSuccessfullRes(fakeLokasi));
    });

    it('mengembalikan 400 dan tidak memanggil service jika lokasi_id bukan uuid', async () => {
        const res = createFakeRes();
        await lokasiController.getByID(createFakeReq({ params: { lokasi_id: 'bukan-uuid' } }), res);

        expect(mockLokasiService.getByID).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            createFailedRes({ errorMsg: { "lokasi_id": ["Format lokasi_id harus UUID yang valid"] } })
        );
    });

    it('mengembalikan 404 jika lokasi tidak ditemukan', async () => {
        mockLokasiService.getByID.mockResolvedValue(null);

        const res = createFakeRes();
        await lokasiController.getByID(createFakeReq({ params: { lokasi_id: lokasiId } }), res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });

    it('mengembalikan 500 jika terjadi error yang tidak terduga', async () => {
        mockLokasiService.getByID.mockRejectedValue(new Error('boom'));

        const res = createFakeRes();
        await lokasiController.getByID(createFakeReq({ params: { lokasi_id: lokasiId } }), res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });
});

describe('LokasiController.create', () => {
    it('mengembalikan response 201 setelah berhasil membuat lokasi', async () => {
        mockLokasiService.create.mockResolvedValue(undefined);

        const res = createFakeRes();
        await lokasiController.create(
            createFakeReq({ body: { nama_lokasi: 'Gedung Baru', jumlah_lantai: 3 } }),
            res
        );

        expect(mockLokasiService.create).toHaveBeenCalledWith({ nama_lokasi: 'Gedung Baru', jumlah_lantai: 3 });
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(createSuccessfullRes());
    });

    it('mengembalikan 400 dan tidak memanggil service jika body tidak valid', async () => {
        const res = createFakeRes();
        await lokasiController.create(
            createFakeReq({ body: { nama_lokasi: '', jumlah_lantai: 0 } }),
            res
        );

        expect(mockLokasiService.create).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            createFailedRes({ errorMsg: { "nama_lokasi": ["Nama lokasi tidak boleh kosong"], "jumlah_lantai": ["Jumlah lantai minimal 1"] } })
        );
    });

    it('mengembalikan 400 dan tidak memanggil service jika request body kosong', async () => {
        const res = createFakeRes();
        await lokasiController.create(createFakeReq({ body: undefined }), res);

        expect(mockLokasiService.create).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });

    it('meneruskan status code AppError dari service', async () => {
        mockLokasiService.create.mockRejectedValue(new AppError('Data sudah ada', 409));

        const res = createFakeRes();
        await lokasiController.create(
            createFakeReq({ body: { nama_lokasi: 'Gedung Baru', jumlah_lantai: 3 } }),
            res
        );

        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });

    it('mengembalikan 500 jika terjadi error yang tidak terduga', async () => {
        mockLokasiService.create.mockRejectedValue(new Error('boom'));

        const res = createFakeRes();
        await lokasiController.create(
            createFakeReq({ body: { nama_lokasi: 'Gedung Baru', jumlah_lantai: 3 } }),
            res
        );

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });
});

describe('LokasiController.update', () => {
    it('mengembalikan response 200 dan meneruskan data hasil validasi ke service', async () => {
        mockLokasiService.update.mockResolvedValue(undefined);

        const res = createFakeRes();
        await lokasiController.update(
            createFakeReq({ params: { lokasi_id: lokasiId }, body: { nama_lokasi: 'Gedung Update' } }),
            res
        );

        expect(mockLokasiService.update).toHaveBeenCalledWith(lokasiId, { nama_lokasi: 'Gedung Update' });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(createSuccessfullRes());
    });

    it('mengembalikan 400 dan tidak memanggil service jika lokasi_id bukan uuid', async () => {
        const res = createFakeRes();
        await lokasiController.update(
            createFakeReq({ params: { lokasi_id: 'bukan-uuid' }, body: { nama_lokasi: 'Gedung Update' } }),
            res
        );

        expect(mockLokasiService.update).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            createFailedRes({ errorMsg: { "lokasi_id": ["Format lokasi_id harus UUID yang valid"] } })
        );
    });

    it('mengembalikan 500 jika terjadi error yang tidak terduga', async () => {
        mockLokasiService.update.mockRejectedValue(new Error('boom'));

        const res = createFakeRes();
        await lokasiController.update(
            createFakeReq({ params: { lokasi_id: lokasiId }, body: { nama_lokasi: 'Gedung Update' } }),
            res
        );

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });
});

describe('LokasiController.delete', () => {
    it('mengembalikan response 200 setelah berhasil menghapus lokasi', async () => {
        mockLokasiService.delete.mockResolvedValue(undefined);

        const res = createFakeRes();
        await lokasiController.delete(createFakeReq({ params: { lokasi_id: lokasiId } }), res);

        expect(mockLokasiService.delete).toHaveBeenCalledWith(lokasiId);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(createSuccessfullRes());
    });

    it('mengembalikan 400 dan tidak memanggil service jika lokasi_id bukan uuid', async () => {
        const res = createFakeRes();
        await lokasiController.delete(createFakeReq({ params: { lokasi_id: 'bukan-uuid' } }), res);

        expect(mockLokasiService.delete).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            createFailedRes({ errorMsg: { "lokasi_id": ["Format lokasi_id harus UUID yang valid"] } })
        );
    });

    it('mengembalikan 500 jika terjadi error yang tidak terduga', async () => {
        mockLokasiService.delete.mockRejectedValue(new Error('boom'));

        const res = createFakeRes();
        await lokasiController.delete(createFakeReq({ params: { lokasi_id: lokasiId } }), res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });
});
