import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";
import type { Request, Response } from "express";
import { KategoriController } from "../../../controllers/kategori_controller";
import type { IKategoriService } from "../../../services/kategori_service.interface";
import type { Kategori } from "../../../generated/prisma/client";
import { AppError } from "../../../utils/error";

const mockKategoriService = mockDeep<IKategoriService>();

const kategoriController = new KategoriController(mockKategoriService);

beforeEach(() => {
    mockReset(mockKategoriService);
});

const kategoriId = '3f2a1b7c-9d4e-4a51-8c6f-1d2e3f4a5b6c';

// Fungsi generate fake data dan bisa juga override
function createFakeKategori(overrides?: Partial<Kategori>): Kategori {
    return {
        id: kategoriId,
        nama_kategori: 'Kebersihan',
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

describe('KategoriController.getAll', () => {
    it('mengembalikan daftar kategori dengan response 200', async () => {
        const fakeKategoris = [createFakeKategori()];
        mockKategoriService.getAll.mockResolvedValue(fakeKategoris);

        const res = createFakeRes();
        await kategoriController.getAll(createFakeReq(), res);

        expect(mockKategoriService.getAll).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(createSuccessfullRes(fakeKategoris));
    });

    it('meneruskan status code AppError dari service', async () => {
        mockKategoriService.getAll.mockRejectedValue(new AppError('Gagal mengambil data', 422));

        const res = createFakeRes();
        await kategoriController.getAll(createFakeReq(), res);

        expect(res.status).toHaveBeenCalledWith(422);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });

    it('mengembalikan 500 jika terjadi error yang tidak terduga', async () => {
        mockKategoriService.getAll.mockRejectedValue(new Error('boom'));

        const res = createFakeRes();
        await kategoriController.getAll(createFakeReq(), res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });
});

describe('KategoriController.getByID', () => {
    it('mengembalikan detail kategori dengan response 200', async () => {
        const fakeKategori = createFakeKategori();
        mockKategoriService.getByID.mockResolvedValue(fakeKategori);

        const res = createFakeRes();
        await kategoriController.getByID(createFakeReq({ params: { kategori_id: kategoriId } }), res);

        expect(mockKategoriService.getByID).toHaveBeenCalledWith(kategoriId);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(createSuccessfullRes(fakeKategori));
    });

    it('mengembalikan 400 dan tidak memanggil service jika kategori_id bukan uuid', async () => {
        const res = createFakeRes();
        await kategoriController.getByID(createFakeReq({ params: { kategori_id: 'bukan-uuid' } }), res);

        expect(mockKategoriService.getByID).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            createFailedRes({ errorMsg: { "kategori_id": ["Format kategori_id harus UUID yang valid"] } })
        );
    });

    it('mengembalikan 404 jika kategori tidak ditemukan', async () => {
        mockKategoriService.getByID.mockResolvedValue(null);

        const res = createFakeRes();
        await kategoriController.getByID(createFakeReq({ params: { kategori_id: kategoriId } }), res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });

    it('mengembalikan 500 jika terjadi error yang tidak terduga', async () => {
        mockKategoriService.getByID.mockRejectedValue(new Error('boom'));

        const res = createFakeRes();
        await kategoriController.getByID(createFakeReq({ params: { kategori_id: kategoriId } }), res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });
});

describe('KategoriController.create', () => {
    it('mengembalikan response 201 setelah berhasil membuat kategori', async () => {
        mockKategoriService.create.mockResolvedValue(undefined);

        const res = createFakeRes();
        await kategoriController.create(createFakeReq({ body: { nama_kategori: 'Kebersihan' } }), res);

        expect(mockKategoriService.create).toHaveBeenCalledWith({ nama_kategori: 'Kebersihan' });
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(createSuccessfullRes());
    });

    it('mengembalikan 400 dan tidak memanggil service jika body tidak valid', async () => {
        const res = createFakeRes();
        await kategoriController.create(createFakeReq({ body: { nama_kategori: '' } }), res);

        expect(mockKategoriService.create).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            createFailedRes({ errorMsg: { "nama_kategori": ["Nama kategori tidak boleh kosong"] } })
        );
    });

    it('mengembalikan 400 dan tidak memanggil service jika request body kosong', async () => {
        const res = createFakeRes();
        await kategoriController.create(createFakeReq({ body: undefined }), res);

        expect(mockKategoriService.create).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });

    it('meneruskan status code AppError dari service', async () => {
        mockKategoriService.create.mockRejectedValue(new AppError('Data sudah ada', 409));

        const res = createFakeRes();
        await kategoriController.create(createFakeReq({ body: { nama_kategori: 'Kebersihan' } }), res);

        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });

    it('mengembalikan 500 jika terjadi error yang tidak terduga', async () => {
        mockKategoriService.create.mockRejectedValue(new Error('boom'));

        const res = createFakeRes();
        await kategoriController.create(createFakeReq({ body: { nama_kategori: 'Kebersihan' } }), res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });
});

describe('KategoriController.update', () => {
    it('mengembalikan response 200 dan meneruskan data hasil validasi ke service', async () => {
        mockKategoriService.update.mockResolvedValue(undefined);

        const res = createFakeRes();
        await kategoriController.update(
            createFakeReq({ params: { kategori_id: kategoriId }, body: { nama_kategori: 'Kebersihan Baru' } }),
            res
        );

        expect(mockKategoriService.update).toHaveBeenCalledWith(kategoriId, { nama_kategori: 'Kebersihan Baru' });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(createSuccessfullRes());
    });

    it('mengembalikan 400 dan tidak memanggil service jika kategori_id bukan uuid', async () => {
        const res = createFakeRes();
        await kategoriController.update(
            createFakeReq({ params: { kategori_id: 'bukan-uuid' }, body: { nama_kategori: 'Kebersihan Baru' } }),
            res
        );

        expect(mockKategoriService.update).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            createFailedRes({ errorMsg: { "kategori_id": ["Format kategori_id harus UUID yang valid"] } })
        );
    });

    it('mengembalikan 400 dan tidak memanggil service jika body tidak valid', async () => {
        const res = createFakeRes();
        await kategoriController.update(
            createFakeReq({ params: { kategori_id: kategoriId }, body: { nama_kategori: '' } }),
            res
        );

        expect(mockKategoriService.update).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            createFailedRes({ errorMsg: { "nama_kategori": ["Nama kategori tidak boleh kosong"] } })
        );
    });

    it('mengembalikan 500 jika terjadi error yang tidak terduga', async () => {
        mockKategoriService.update.mockRejectedValue(new Error('boom'));

        const res = createFakeRes();
        await kategoriController.update(
            createFakeReq({ params: { kategori_id: kategoriId }, body: { nama_kategori: 'Kebersihan Baru' } }),
            res
        );

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });
});

describe('KategoriController.delete', () => {
    it('mengembalikan response 200 setelah berhasil menghapus kategori', async () => {
        mockKategoriService.delete.mockResolvedValue(undefined);

        const res = createFakeRes();
        await kategoriController.delete(createFakeReq({ params: { kategori_id: kategoriId } }), res);

        expect(mockKategoriService.delete).toHaveBeenCalledWith(kategoriId);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(createSuccessfullRes());
    });

    it('mengembalikan 400 dan tidak memanggil service jika kategori_id bukan uuid', async () => {
        const res = createFakeRes();
        await kategoriController.delete(createFakeReq({ params: { kategori_id: 'bukan-uuid' } }), res);

        expect(mockKategoriService.delete).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            createFailedRes({ errorMsg: { "kategori_id": ["Format kategori_id harus UUID yang valid"] } })
        );
    });

    it('mengembalikan 500 jika terjadi error yang tidak terduga', async () => {
        mockKategoriService.delete.mockRejectedValue(new Error('boom'));

        const res = createFakeRes();
        await kategoriController.delete(createFakeReq({ params: { kategori_id: kategoriId } }), res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });
});
