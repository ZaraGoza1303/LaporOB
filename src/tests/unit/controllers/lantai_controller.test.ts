import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";
import type { Request, Response } from "express";
import { LantaiController } from "../../../controllers/lantai_controller";
import type { ILantaiService } from "../../../services/lantai_service.interface";
import type { Lantai } from "../../../generated/prisma/client";
import { AppError } from "../../../utils/error";

const mockLantaiService = mockDeep<ILantaiService>();

const lantaiController = new LantaiController(mockLantaiService);

beforeEach(() => {
    mockReset(mockLantaiService);
});

const lokasiId = 'e2fbdc6f-ec0d-4547-a51d-a81b69741ed2';
const lantaiId = '3f2a1b7c-9d4e-4a51-8c6f-1d2e3f4a5b6c';

// Fungsi generate fake data dan bisa juga override
function createFakeLantai(overrides?: Partial<Lantai>): Lantai {
    return {
        id: lantaiId,
        lokasi_id: lokasiId,
        nomor_lantai: 1,
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

describe('LantaiController.getAll', () => {
    it('mengembalikan daftar lantai dengan response 200', async () => {
        const fakeLantais = [createFakeLantai()];
        mockLantaiService.getAll.mockResolvedValue(fakeLantais);

        const res = createFakeRes();
        await lantaiController.getAll(createFakeReq(), res);

        expect(mockLantaiService.getAll).toHaveBeenCalledWith(undefined);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(createSuccessfullRes(fakeLantais));
    });

    it('meneruskan lokasi_id dari query ke service', async () => {
        mockLantaiService.getAll.mockResolvedValue([createFakeLantai()]);

        const res = createFakeRes();
        await lantaiController.getAll(createFakeReq({ query: { lokasi_id: lokasiId } }), res);

        expect(mockLantaiService.getAll).toHaveBeenCalledWith(lokasiId);
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('mengembalikan 400 dan tidak memanggil service jika query tidak valid', async () => {
        const res = createFakeRes();
        await lantaiController.getAll(createFakeReq({ query: { lokasi_id: 'bukan-uuid' } }), res);

        expect(mockLantaiService.getAll).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            createFailedRes({ errorMsg: { "lokasi_id": ["Format lokasi_id wajib berupa UUID yang valid"] } })
        );
    });

    it('mengembalikan 500 jika terjadi error yang tidak terduga', async () => {
        mockLantaiService.getAll.mockRejectedValue(new Error('boom'));

        const res = createFakeRes();
        await lantaiController.getAll(createFakeReq(), res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });
});

describe('LantaiController.getByID', () => {
    it('mengembalikan detail lantai dengan response 200', async () => {
        const fakeLantai = createFakeLantai();
        mockLantaiService.getById.mockResolvedValue(fakeLantai);

        const res = createFakeRes();
        await lantaiController.getByID(createFakeReq({ params: { lantai_id: lantaiId } }), res);

        expect(mockLantaiService.getById).toHaveBeenCalledWith(undefined, lantaiId);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(createSuccessfullRes(fakeLantai));
    });

    it('meneruskan lokasi_id dari query ke service', async () => {
        mockLantaiService.getById.mockResolvedValue(createFakeLantai());

        const res = createFakeRes();
        await lantaiController.getByID(
            createFakeReq({ params: { lantai_id: lantaiId }, query: { lokasi_id: lokasiId } }),
            res
        );

        expect(mockLantaiService.getById).toHaveBeenCalledWith(lokasiId, lantaiId);
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('mengembalikan 400 dan tidak memanggil service jika lantai_id bukan uuid', async () => {
        const res = createFakeRes();
        await lantaiController.getByID(createFakeReq({ params: { lantai_id: 'bukan-uuid' } }), res);

        expect(mockLantaiService.getById).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            createFailedRes({ errorMsg: { "lantai_id": ["Format lantai_id harus UUID yang valid"] } })
        );
    });

    it('mengembalikan 404 jika lantai tidak ditemukan', async () => {
        mockLantaiService.getById.mockResolvedValue(null);

        const res = createFakeRes();
        await lantaiController.getByID(createFakeReq({ params: { lantai_id: lantaiId } }), res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });

    it('mengembalikan 500 jika terjadi error yang tidak terduga', async () => {
        mockLantaiService.getById.mockRejectedValue(new Error('boom'));

        const res = createFakeRes();
        await lantaiController.getByID(createFakeReq({ params: { lantai_id: lantaiId } }), res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });
});

describe('LantaiController.create', () => {
    it('mengembalikan response 201 setelah berhasil membuat lantai', async () => {
        mockLantaiService.create.mockResolvedValue(undefined);

        const res = createFakeRes();
        await lantaiController.create(
            createFakeReq({ body: { lokasi_id: lokasiId, nomor_lantai: 2 } }),
            res
        );

        expect(mockLantaiService.create).toHaveBeenCalledWith({ lokasi_id: lokasiId, nomor_lantai: 2 });
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(createSuccessfullRes());
    });

    it('mengembalikan 400 dan tidak memanggil service jika body tidak valid', async () => {
        const res = createFakeRes();
        await lantaiController.create(
            createFakeReq({ body: { lokasi_id: 'bukan-uuid', nomor_lantai: 2 } }),
            res
        );

        expect(mockLantaiService.create).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            createFailedRes({ errorMsg: { "lokasi_id": ["Format Lokasi ID harus berupa UUID yang valid"] } })
        );
    });

    it('mengembalikan 400 dan tidak memanggil service jika request body kosong', async () => {
        const res = createFakeRes();
        await lantaiController.create(createFakeReq({ body: undefined }), res);

        expect(mockLantaiService.create).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });

    it('mengembalikan 500 jika terjadi error yang tidak terduga', async () => {
        mockLantaiService.create.mockRejectedValue(new Error('boom'));

        const res = createFakeRes();
        await lantaiController.create(
            createFakeReq({ body: { lokasi_id: lokasiId, nomor_lantai: 2 } }),
            res
        );

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });
});

describe('LantaiController.update', () => {
    it('mengembalikan response 200 dan meneruskan data hasil validasi ke service', async () => {
        mockLantaiService.update.mockResolvedValue(undefined);

        const res = createFakeRes();
        await lantaiController.update(
            createFakeReq({ params: { lantai_id: lantaiId }, body: { nomor_lantai: 5 } }),
            res
        );

        expect(mockLantaiService.update).toHaveBeenCalledWith(undefined, lantaiId, { nomor_lantai: 5 });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(createSuccessfullRes());
    });

    it('mengembalikan 400 dan tidak memanggil service jika lantai_id bukan uuid', async () => {
        const res = createFakeRes();
        await lantaiController.update(
            createFakeReq({ params: { lantai_id: 'bukan-uuid' }, body: { nomor_lantai: 5 } }),
            res
        );

        expect(mockLantaiService.update).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            createFailedRes({ errorMsg: { "lantai_id": ["Format lantai_id harus UUID yang valid"] } })
        );
    });

    it('mengembalikan 500 jika terjadi error yang tidak terduga', async () => {
        mockLantaiService.update.mockRejectedValue(new Error('boom'));

        const res = createFakeRes();
        await lantaiController.update(
            createFakeReq({ params: { lantai_id: lantaiId }, body: { nomor_lantai: 5 } }),
            res
        );

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });
});

describe('LantaiController.delete', () => {
    it('mengembalikan response 200 setelah berhasil menghapus lantai', async () => {
        mockLantaiService.delete.mockResolvedValue(undefined);

        const res = createFakeRes();
        await lantaiController.delete(createFakeReq({ params: { lantai_id: lantaiId } }), res);

        expect(mockLantaiService.delete).toHaveBeenCalledWith(undefined, lantaiId);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(createSuccessfullRes());
    });

    it('mengembalikan 400 dan tidak memanggil service jika lantai_id bukan uuid', async () => {
        const res = createFakeRes();
        await lantaiController.delete(createFakeReq({ params: { lantai_id: 'bukan-uuid' } }), res);

        expect(mockLantaiService.delete).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            createFailedRes({ errorMsg: { "lantai_id": ["Format lantai_id harus UUID yang valid"] } })
        );
    });

    it('mengembalikan 500 jika terjadi error yang tidak terduga', async () => {
        mockLantaiService.delete.mockRejectedValue(new Error('boom'));

        const res = createFakeRes();
        await lantaiController.delete(createFakeReq({ params: { lantai_id: lantaiId } }), res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });
});
