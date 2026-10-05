import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";
import type { Request, Response } from "express";
import { RuanganController } from "../../../controllers/ruangan_controller";
import type { IRuanganService } from "../../../services/ruangan_service.interface";
import type { Ruangan } from "../../../generated/prisma/client";

const mockRuanganService = mockDeep<IRuanganService>();

const ruanganController = new RuanganController(mockRuanganService);

beforeEach(() => {
    mockReset(mockRuanganService);
});

const lantaiId = 'e2fbdc6f-ec0d-4547-a51d-a81b69741ed2';
const ruanganId = '3f2a1b7c-9d4e-4a51-8c6f-1d2e3f4a5b6c';

// Fungsi generate fake data dan bisa juga override
function createFakeRuangan(overrides?: Partial<Ruangan>): Ruangan {
    return {
        id: ruanganId,
        lantai_id: lantaiId,
        nama: 'Ruang Meeting',
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

describe('RuanganController.getAll', () => {
    it('mengembalikan daftar ruangan dengan response 200', async () => {
        const fakeRuangans = [createFakeRuangan()];
        mockRuanganService.getAll.mockResolvedValue(fakeRuangans);

        const res = createFakeRes();
        await ruanganController.getAll(createFakeReq(), res);

        expect(mockRuanganService.getAll).toHaveBeenCalledWith(undefined);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(createSuccessfullRes(fakeRuangans));
    });

    it('meneruskan lantai_id dari query ke service', async () => {
        mockRuanganService.getAll.mockResolvedValue([createFakeRuangan()]);

        const res = createFakeRes();
        await ruanganController.getAll(createFakeReq({ query: { lantai_id: lantaiId } }), res);

        expect(mockRuanganService.getAll).toHaveBeenCalledWith(lantaiId);
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('mengembalikan 400 dan tidak memanggil service jika query tidak valid', async () => {
        const res = createFakeRes();
        await ruanganController.getAll(createFakeReq({ query: { lantai_id: 'bukan-uuid' } }), res);

        expect(mockRuanganService.getAll).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            createFailedRes({ errorMsg: { "lantai_id": ["Format lantai_id wajib berupa UUID yang valid"] } })
        );
    });

    it('mengembalikan 500 jika terjadi error yang tidak terduga', async () => {
        mockRuanganService.getAll.mockRejectedValue(new Error('boom'));

        const res = createFakeRes();
        await ruanganController.getAll(createFakeReq(), res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });
});

describe('RuanganController.getByID', () => {
    it('mengembalikan detail ruangan dengan response 200', async () => {
        const fakeRuangan = createFakeRuangan();
        mockRuanganService.getById.mockResolvedValue(fakeRuangan);

        const res = createFakeRes();
        await ruanganController.getByID(createFakeReq({ params: { ruangan_id: ruanganId } }), res);

        expect(mockRuanganService.getById).toHaveBeenCalledWith(undefined, ruanganId);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(createSuccessfullRes(fakeRuangan));
    });

    it('meneruskan lantai_id dari query ke service', async () => {
        mockRuanganService.getById.mockResolvedValue(createFakeRuangan());

        const res = createFakeRes();
        await ruanganController.getByID(
            createFakeReq({ params: { ruangan_id: ruanganId }, query: { lantai_id: lantaiId } }),
            res
        );

        expect(mockRuanganService.getById).toHaveBeenCalledWith(lantaiId, ruanganId);
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('mengembalikan 400 dan tidak memanggil service jika ruangan_id bukan uuid', async () => {
        const res = createFakeRes();
        await ruanganController.getByID(createFakeReq({ params: { ruangan_id: 'bukan-uuid' } }), res);

        expect(mockRuanganService.getById).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            createFailedRes({ errorMsg: { "ruangan_id": ["Format ruangan_id harus UUID yang valid"] } })
        );
    });

    it('mengembalikan 404 jika ruangan tidak ditemukan', async () => {
        mockRuanganService.getById.mockResolvedValue(null);

        const res = createFakeRes();
        await ruanganController.getByID(createFakeReq({ params: { ruangan_id: ruanganId } }), res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });

    it('mengembalikan 500 jika terjadi error yang tidak terduga', async () => {
        mockRuanganService.getById.mockRejectedValue(new Error('boom'));

        const res = createFakeRes();
        await ruanganController.getByID(createFakeReq({ params: { ruangan_id: ruanganId } }), res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });
});

describe('RuanganController.create', () => {
    it('mengembalikan response 201 setelah berhasil membuat ruangan', async () => {
        mockRuanganService.create.mockResolvedValue(undefined);

        const res = createFakeRes();
        await ruanganController.create(
            createFakeReq({ body: { lantai_id: lantaiId, nama: 'Ruang Meeting' } }),
            res
        );

        expect(mockRuanganService.create).toHaveBeenCalledWith({ lantai_id: lantaiId, nama: 'Ruang Meeting' });
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(createSuccessfullRes());
    });

    it('mengembalikan 400 dan tidak memanggil service jika body tidak valid', async () => {
        const res = createFakeRes();
        await ruanganController.create(
            createFakeReq({ body: { lantai_id: 'bukan-uuid', nama: 'Ruang Meeting' } }),
            res
        );

        expect(mockRuanganService.create).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            createFailedRes({ errorMsg: { "lantai_id": ["Format Lantai ID harus berupa UUID yang valid"] } })
        );
    });

    it('mengembalikan 400 dan tidak memanggil service jika request body kosong', async () => {
        const res = createFakeRes();
        await ruanganController.create(createFakeReq({ body: undefined }), res);

        expect(mockRuanganService.create).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });

    it('mengembalikan 500 jika terjadi error yang tidak terduga', async () => {
        mockRuanganService.create.mockRejectedValue(new Error('boom'));

        const res = createFakeRes();
        await ruanganController.create(
            createFakeReq({ body: { lantai_id: lantaiId, nama: 'Ruang Meeting' } }),
            res
        );

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });
});

describe('RuanganController.update', () => {
    it('mengembalikan response 200 dan meneruskan data hasil validasi ke service', async () => {
        mockRuanganService.update.mockResolvedValue(undefined);

        const res = createFakeRes();
        await ruanganController.update(
            createFakeReq({ params: { ruangan_id: ruanganId }, body: { nama: 'Ruang Baru' } }),
            res
        );

        expect(mockRuanganService.update).toHaveBeenCalledWith(undefined, ruanganId, { nama: 'Ruang Baru' });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(createSuccessfullRes());
    });

    it('mengembalikan 400 dan tidak memanggil service jika ruangan_id bukan uuid', async () => {
        const res = createFakeRes();
        await ruanganController.update(
            createFakeReq({ params: { ruangan_id: 'bukan-uuid' }, body: { nama: 'Ruang Baru' } }),
            res
        );

        expect(mockRuanganService.update).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            createFailedRes({ errorMsg: { "ruangan_id": ["Format ruangan_id harus UUID yang valid"] } })
        );
    });

    it('mengembalikan 500 jika terjadi error yang tidak terduga', async () => {
        mockRuanganService.update.mockRejectedValue(new Error('boom'));

        const res = createFakeRes();
        await ruanganController.update(
            createFakeReq({ params: { ruangan_id: ruanganId }, body: { nama: 'Ruang Baru' } }),
            res
        );

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });
});

describe('RuanganController.delete', () => {
    it('mengembalikan response 200 setelah berhasil menghapus ruangan', async () => {
        mockRuanganService.delete.mockResolvedValue(undefined);

        const res = createFakeRes();
        await ruanganController.delete(createFakeReq({ params: { ruangan_id: ruanganId } }), res);

        expect(mockRuanganService.delete).toHaveBeenCalledWith(undefined, ruanganId);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(createSuccessfullRes());
    });

    it('mengembalikan 400 dan tidak memanggil service jika ruangan_id bukan uuid', async () => {
        const res = createFakeRes();
        await ruanganController.delete(createFakeReq({ params: { ruangan_id: 'bukan-uuid' } }), res);

        expect(mockRuanganService.delete).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            createFailedRes({ errorMsg: { "ruangan_id": ["Format ruangan_id harus UUID yang valid"] } })
        );
    });

    it('mengembalikan 500 jika terjadi error yang tidak terduga', async () => {
        mockRuanganService.delete.mockRejectedValue(new Error('boom'));

        const res = createFakeRes();
        await ruanganController.delete(createFakeReq({ params: { ruangan_id: ruanganId } }), res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });
});
