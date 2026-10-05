import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";
import type { Request, Response } from "express";
import { JadwalChecklistController } from "../../../controllers/jadwalChecklist_controller";
import type { IJadwalChecklistService } from "../../../services/jadwalChecklist_service.interface";
import type { JadwalChecklist } from "../../../generated/prisma/client";
import { AppError } from "../../../utils/error";

const mockJadwalService = mockDeep<IJadwalChecklistService>();

const jadwalController = new JadwalChecklistController(mockJadwalService);

beforeEach(() => {
    mockReset(mockJadwalService);
});

const jadwalId = '3f2a1b7c-9d4e-4a51-8c6f-1d2e3f4a5b6c';
const kategoriId = 'e2fbdc6f-ec0d-4547-a51d-a81b69741ed2';
const lantaiId = '852a6e0e-1bcf-4578-b93b-46f893544bfc';

// Fungsi generate fake data dan bisa juga override
function createFakeJadwal(overrides?: Partial<JadwalChecklist>): JadwalChecklist {
    return {
        id: jadwalId,
        nama_tugas: 'Sapu Lantai',
        lantai_id: lantaiId,
        kategori_id: kategoriId,
        ob_id: null,
        hari: ['senin'],
        created_at: new Date('2026-01-01T00:00:00Z'),
        updated_at: new Date('2026-01-01T00:00:00Z'),
        ...overrides,
    };
}

// Fake req/res express.
function createFakeReq(overrides?: {
    params?: Record<string, string>;
    body?: Record<string, unknown>;
    user?: { id: string; username: string; role: string };
}) {
    return { params: {}, body: {}, ...overrides } as unknown as Request;
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

describe('JadwalChecklistController.getAll', () => {
    it('mengembalikan daftar jadwal dengan response 200', async () => {
        const fakeJadwals = [createFakeJadwal()];
        mockJadwalService.getAll.mockResolvedValue(fakeJadwals);

        const res = createFakeRes();
        await jadwalController.getAll(createFakeReq(), res);

        expect(mockJadwalService.getAll).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(createSuccessfullRes(fakeJadwals));
    });

    it('mengembalikan 500 jika terjadi error yang tidak terduga', async () => {
        mockJadwalService.getAll.mockRejectedValue(new Error('boom'));

        const res = createFakeRes();
        await jadwalController.getAll(createFakeReq(), res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });
});

describe('JadwalChecklistController.create', () => {
    it('mengembalikan response 201 setelah berhasil membuat jadwal', async () => {
        mockJadwalService.create.mockResolvedValue(undefined);

        const res = createFakeRes();
        await jadwalController.create(
            createFakeReq({
                user: { id: 'admin-1', username: 'admin', role: 'admin' },
                body: { nama_tugas: 'Sapu Lantai', kategori_id: kategoriId, lantai_id: lantaiId },
            }),
            res
        );

        expect(mockJadwalService.create).toHaveBeenCalledWith(
            'admin-1',
            expect.objectContaining({ nama_tugas: 'Sapu Lantai' })
        );
        expect(res.status).toHaveBeenCalledWith(201);
    });

    it('mengembalikan 400 dan tidak memanggil service jika body tidak valid', async () => {
        const res = createFakeRes();
        await jadwalController.create(
            createFakeReq({
                user: { id: 'admin-1', username: 'admin', role: 'admin' },
                body: { nama_tugas: '', kategori_id: kategoriId, lantai_id: lantaiId },
            }),
            res
        );

        expect(mockJadwalService.create).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            createFailedRes({ errorMsg: { "nama_tugas": ["Nama tugas wajib diisi"] } })
        );
    });

    it('meneruskan status code AppError dari service', async () => {
        mockJadwalService.create.mockRejectedValue(new AppError('Gagal', 422));

        const res = createFakeRes();
        await jadwalController.create(
            createFakeReq({
                user: { id: 'admin-1', username: 'admin', role: 'admin' },
                body: { nama_tugas: 'Sapu Lantai', kategori_id: kategoriId, lantai_id: lantaiId },
            }),
            res
        );

        expect(res.status).toHaveBeenCalledWith(422);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });
});

describe('JadwalChecklistController.getByID', () => {
    it('mengembalikan detail jadwal dengan response 200', async () => {
        const fakeJadwal = createFakeJadwal();
        mockJadwalService.getByID.mockResolvedValue(fakeJadwal);

        const res = createFakeRes();
        await jadwalController.getByID(createFakeReq({ params: { jadwal_checklist_id: jadwalId } }), res);

        expect(mockJadwalService.getByID).toHaveBeenCalledWith(jadwalId);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(createSuccessfullRes(fakeJadwal));
    });

    it('mengembalikan 400 dan tidak memanggil service jika id bukan uuid', async () => {
        const res = createFakeRes();
        await jadwalController.getByID(createFakeReq({ params: { jadwal_checklist_id: 'bukan-uuid' } }), res);

        expect(mockJadwalService.getByID).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            createFailedRes({ errorMsg: { "jadwal_checklist_id": ["Format jadwal_checklist_id harus UUID yang valid"] } })
        );
    });

    it('mengembalikan 404 jika jadwal tidak ditemukan', async () => {
        mockJadwalService.getByID.mockResolvedValue(null);

        const res = createFakeRes();
        await jadwalController.getByID(createFakeReq({ params: { jadwal_checklist_id: jadwalId } }), res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });
});

describe('JadwalChecklistController.update', () => {
    it('mengembalikan response 200 setelah berhasil update', async () => {
        mockJadwalService.update.mockResolvedValue(undefined);

        const res = createFakeRes();
        await jadwalController.update(
            createFakeReq({ params: { jadwal_checklist_id: jadwalId }, body: { nama_tugas: 'Pel Lantai' } }),
            res
        );

        expect(mockJadwalService.update).toHaveBeenCalledWith(jadwalId, { nama_tugas: 'Pel Lantai' });
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('mengembalikan 400 dan tidak memanggil service jika id bukan uuid', async () => {
        const res = createFakeRes();
        await jadwalController.update(
            createFakeReq({ params: { jadwal_checklist_id: 'bukan-uuid' }, body: { nama_tugas: 'Pel' } }),
            res
        );

        expect(mockJadwalService.update).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('mengembalikan 500 jika terjadi error yang tidak terduga', async () => {
        mockJadwalService.update.mockRejectedValue(new Error('boom'));

        const res = createFakeRes();
        await jadwalController.update(
            createFakeReq({ params: { jadwal_checklist_id: jadwalId }, body: { nama_tugas: 'Pel' } }),
            res
        );

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });
});

describe('JadwalChecklistController.delete', () => {
    it('mengembalikan response 200 setelah berhasil menghapus', async () => {
        mockJadwalService.delete.mockResolvedValue(undefined);

        const res = createFakeRes();
        await jadwalController.delete(createFakeReq({ params: { jadwal_checklist_id: jadwalId } }), res);

        expect(mockJadwalService.delete).toHaveBeenCalledWith(jadwalId);
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('mengembalikan 400 dan tidak memanggil service jika id bukan uuid', async () => {
        const res = createFakeRes();
        await jadwalController.delete(createFakeReq({ params: { jadwal_checklist_id: 'bukan-uuid' } }), res);

        expect(mockJadwalService.delete).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('mengembalikan 500 jika terjadi error yang tidak terduga', async () => {
        mockJadwalService.delete.mockRejectedValue(new Error('boom'));

        const res = createFakeRes();
        await jadwalController.delete(createFakeReq({ params: { jadwal_checklist_id: jadwalId } }), res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });
});
