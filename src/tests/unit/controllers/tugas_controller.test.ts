import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";
import type { Request, Response } from "express";
import { TugasController } from "../../../controllers/tugas_controller";
import type { ITugasService } from "../../../services/tugas_service.interface";
import type { TugasDetailRes } from "../../../types/tugas";
import { AppError } from "../../../utils/error";

const mockTugasService = mockDeep<ITugasService>();

const tugasController = new TugasController(mockTugasService);

beforeEach(() => {
    mockReset(mockTugasService);
});

const tugasId = '3f2a1b7c-9d4e-4a51-8c6f-1d2e3f4a5b6c';
const kategoriId = 'e2fbdc6f-ec0d-4547-a51d-a81b69741ed2';

// Fungsi generate fake data dan bisa juga override
function createFakeTugasDetail(overrides?: Partial<TugasDetailRes>): TugasDetailRes {
    return {
        id: tugasId,
        nama_tugas: 'Bersihkan Lantai',
        kategori: { id: kategoriId, nama_kategori: 'Kebersihan' },
        lantai: null,
        ob: null,
        status: 'BELUM_DIKERJAKAN',
        catatan: null,
        foto_awal: [],
        foto_akhir: [],
        dikerjakan_at: null,
        selesai_at: null,
        total_durasi: null,
        hari: [],
        is_approved: false,
        approved_at: null,
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

describe('TugasController.getAll', () => {
    it('mengembalikan daftar tugas dengan response 200', async () => {
        const fakeTugas = [createFakeTugasDetail()];
        mockTugasService.getAll.mockResolvedValue(fakeTugas);

        const res = createFakeRes();
        await tugasController.getAll(createFakeReq(), res);

        expect(mockTugasService.getAll).toHaveBeenCalledWith(undefined);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(createSuccessfullRes(fakeTugas));
    });

    it('meneruskan kategori_id dari query ke service', async () => {
        mockTugasService.getAll.mockResolvedValue([createFakeTugasDetail()]);

        const res = createFakeRes();
        await tugasController.getAll(createFakeReq({ query: { kategori_id: kategoriId } }), res);

        expect(mockTugasService.getAll).toHaveBeenCalledWith(kategoriId);
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('mengembalikan 400 dan tidak memanggil service jika query tidak valid', async () => {
        const res = createFakeRes();
        await tugasController.getAll(createFakeReq({ query: { kategori_id: 'bukan-uuid' } }), res);

        expect(mockTugasService.getAll).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            createFailedRes({ errorMsg: { "kategori_id": ["Format Kategori ID harus berupa UUID yang valid"] } })
        );
    });

    it('mengembalikan 500 jika terjadi error yang tidak terduga', async () => {
        mockTugasService.getAll.mockRejectedValue(new Error('boom'));

        const res = createFakeRes();
        await tugasController.getAll(createFakeReq(), res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });
});

describe('TugasController.getByID', () => {
    it('mengembalikan detail tugas dengan response 200', async () => {
        const fakeTugas = createFakeTugasDetail();
        mockTugasService.getDetailByID.mockResolvedValue(fakeTugas);

        const res = createFakeRes();
        await tugasController.getByID(createFakeReq({ params: { tugas_id: tugasId } }), res);

        expect(mockTugasService.getDetailByID).toHaveBeenCalledWith(tugasId);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(createSuccessfullRes(fakeTugas));
    });

    it('mengembalikan 400 dan tidak memanggil service jika tugas_id bukan uuid', async () => {
        const res = createFakeRes();
        await tugasController.getByID(createFakeReq({ params: { tugas_id: 'bukan-uuid' } }), res);

        expect(mockTugasService.getDetailByID).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            createFailedRes({ errorMsg: { "tugas_id": ["Format tugas_id harus UUID yang valid"] } })
        );
    });

    it('mengembalikan 404 jika tugas tidak ditemukan', async () => {
        mockTugasService.getDetailByID.mockResolvedValue(null);

        const res = createFakeRes();
        await tugasController.getByID(createFakeReq({ params: { tugas_id: tugasId } }), res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });

    it('mengembalikan 500 jika terjadi error yang tidak terduga', async () => {
        mockTugasService.getDetailByID.mockRejectedValue(new Error('boom'));

        const res = createFakeRes();
        await tugasController.getByID(createFakeReq({ params: { tugas_id: tugasId } }), res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });
});

describe('TugasController.create', () => {
    it('mengembalikan response 201 setelah berhasil membuat tugas', async () => {
        mockTugasService.create.mockResolvedValue(undefined);

        const res = createFakeRes();
        await tugasController.create(
            createFakeReq({ body: { kategori_id: kategoriId, nama_tugas: 'Bersihkan Lantai', tanggal_selesai: '2026-01-10' } }),
            res
        );

        expect(mockTugasService.create).toHaveBeenCalledWith(
            expect.objectContaining({ kategori_id: kategoriId, nama_tugas: 'Bersihkan Lantai' })
        );
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(createSuccessfullRes());
    });

    it('mengembalikan 400 dan tidak memanggil service jika body tidak valid', async () => {
        const res = createFakeRes();
        await tugasController.create(
            createFakeReq({ body: { kategori_id: 'bukan-uuid', nama_tugas: '' } }),
            res
        );

        expect(mockTugasService.create).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            createFailedRes({ errorMsg: { "kategori_id": ["Format Kategori ID harus berupa UUID yang valid"], "nama_tugas": ["Nama tugas tidak boleh kosong"], "tanggal_selesai": ["tanggal_selesai wajib diisi"] } })
        );
    });

    it('mengembalikan 400 dan tidak memanggil service jika request body kosong', async () => {
        const res = createFakeRes();
        await tugasController.create(createFakeReq({ body: undefined }), res);

        expect(mockTugasService.create).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });

    it('meneruskan status code AppError dari service', async () => {
        mockTugasService.create.mockRejectedValue(new AppError('Data sudah ada', 409));

        const res = createFakeRes();
        await tugasController.create(
            createFakeReq({ body: { kategori_id: kategoriId, nama_tugas: 'Bersihkan Lantai', tanggal_selesai: '2026-01-10' } }),
            res
        );

        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });

    it('mengembalikan 500 jika terjadi error yang tidak terduga', async () => {
        mockTugasService.create.mockRejectedValue(new Error('boom'));

        const res = createFakeRes();
        await tugasController.create(
            createFakeReq({ body: { kategori_id: kategoriId, nama_tugas: 'Bersihkan Lantai', tanggal_selesai: '2026-01-10' } }),
            res
        );

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });
});

describe('TugasController.update', () => {
    it('mengembalikan response 200 dan meneruskan data hasil validasi ke service', async () => {
        mockTugasService.update.mockResolvedValue(undefined);

        const res = createFakeRes();
        await tugasController.update(
            createFakeReq({ params: { tugas_id: tugasId }, body: { nama_tugas: 'Tugas Baru' } }),
            res
        );

        expect(mockTugasService.update).toHaveBeenCalledWith(tugasId, { nama_tugas: 'Tugas Baru' });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(createSuccessfullRes());
    });

    it('mengembalikan 400 dan tidak memanggil service jika tugas_id bukan uuid', async () => {
        const res = createFakeRes();
        await tugasController.update(
            createFakeReq({ params: { tugas_id: 'bukan-uuid' }, body: { nama_tugas: 'Tugas Baru' } }),
            res
        );

        expect(mockTugasService.update).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            createFailedRes({ errorMsg: { "tugas_id": ["Format tugas_id harus UUID yang valid"] } })
        );
    });

    it('mengembalikan 500 jika terjadi error yang tidak terduga', async () => {
        mockTugasService.update.mockRejectedValue(new Error('boom'));

        const res = createFakeRes();
        await tugasController.update(
            createFakeReq({ params: { tugas_id: tugasId }, body: { nama_tugas: 'Tugas Baru' } }),
            res
        );

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });
});

describe('TugasController.delete', () => {
    it('mengembalikan response 200 setelah berhasil menghapus tugas', async () => {
        mockTugasService.delete.mockResolvedValue(undefined);

        const res = createFakeRes();
        await tugasController.delete(createFakeReq({ params: { tugas_id: tugasId } }), res);

        expect(mockTugasService.delete).toHaveBeenCalledWith(tugasId);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(createSuccessfullRes());
    });

    it('mengembalikan 400 dan tidak memanggil service jika tugas_id bukan uuid', async () => {
        const res = createFakeRes();
        await tugasController.delete(createFakeReq({ params: { tugas_id: 'bukan-uuid' } }), res);

        expect(mockTugasService.delete).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            createFailedRes({ errorMsg: { "tugas_id": ["Format tugas_id harus UUID yang valid"] } })
        );
    });

    it('mengembalikan 500 jika terjadi error yang tidak terduga', async () => {
        mockTugasService.delete.mockRejectedValue(new Error('boom'));

        const res = createFakeRes();
        await tugasController.delete(createFakeReq({ params: { tugas_id: tugasId } }), res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });
});
