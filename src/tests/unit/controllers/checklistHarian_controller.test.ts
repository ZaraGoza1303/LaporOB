import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";
import type { Request, Response } from "express";
import { ChecklistHarianController } from "../../../controllers/checklistHarian_controller";
import type { IChecklistHarianService } from "../../../services/checklistHarian_service.interface";
import { AppError } from "../../../utils/error";

const mockChecklistService = mockDeep<IChecklistHarianService>();

const checklistController = new ChecklistHarianController(mockChecklistService);

beforeEach(() => {
    mockReset(mockChecklistService);
});

const checklistId = '3f2a1b7c-9d4e-4a51-8c6f-1d2e3f4a5b6c';
const obId = 'e2fbdc6f-ec0d-4547-a51d-a81b69741ed2';

// Fungsi generate fake data dan bisa juga override
function createFakeChecklistRes(overrides?: Record<string, unknown>) {
    return {
        id: checklistId,
        nama_tugas: 'Sapu Lantai',
        ob_id: obId,
        status: 'BELUM_DIKERJAKAN',
        ...overrides,
    };
}

// Fake req/res express.
function createFakeReq(overrides?: {
    query?: Record<string, unknown>;
    params?: Record<string, string>;
    body?: Record<string, unknown>;
    user?: { id: string; username: string; role: string };
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

describe('ChecklistHarianController.getAll', () => {
    it('mengembalikan daftar checklist dengan response 200 untuk admin', async () => {
        const fakeItems = [createFakeChecklistRes()];
        mockChecklistService.getAll.mockResolvedValue(fakeItems as never);

        const res = createFakeRes();
        await checklistController.getAll(
            createFakeReq({ user: { id: 'admin-1', username: 'admin', role: 'admin' } }),
            res
        );

        expect(mockChecklistService.getAll).toHaveBeenCalledWith(undefined);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(createSuccessfullRes(fakeItems));
    });

    it('memfilter berdasarkan ob_id jika yang login OB', async () => {
        mockChecklistService.getAll.mockResolvedValue([createFakeChecklistRes()] as never);

        const res = createFakeRes();
        await checklistController.getAll(
            createFakeReq({ user: { id: obId, username: 'farhan_ob', role: 'OB' } }),
            res
        );

        expect(mockChecklistService.getAll).toHaveBeenCalledWith(obId);
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('mengembalikan 500 jika terjadi error yang tidak terduga', async () => {
        mockChecklistService.getAll.mockRejectedValue(new Error('boom'));

        const res = createFakeRes();
        await checklistController.getAll(createFakeReq(), res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });
});

describe('ChecklistHarianController.getByID', () => {
    it('mengembalikan detail checklist dengan response 200', async () => {
        const fakeItem = createFakeChecklistRes();
        mockChecklistService.getByID.mockResolvedValue(fakeItem as never);

        const res = createFakeRes();
        await checklistController.getByID(createFakeReq({ params: { checklist_harian_id: checklistId } }), res);

        expect(mockChecklistService.getByID).toHaveBeenCalledWith(checklistId, undefined);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(createSuccessfullRes(fakeItem));
    });

    it('mengembalikan 400 dan tidak memanggil service jika id bukan uuid', async () => {
        const res = createFakeRes();
        await checklistController.getByID(createFakeReq({ params: { checklist_harian_id: 'bukan-uuid' } }), res);

        expect(mockChecklistService.getByID).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            createFailedRes({ errorMsg: { "checklist_harian_id": ["Format checklist_harian_id harus UUID yang valid"] } })
        );
    });

    it('mengembalikan 404 jika checklist tidak ditemukan', async () => {
        mockChecklistService.getByID.mockResolvedValue(null);

        const res = createFakeRes();
        await checklistController.getByID(createFakeReq({ params: { checklist_harian_id: checklistId } }), res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });

    it('meneruskan status code AppError dari service', async () => {
        mockChecklistService.getByID.mockRejectedValue(new AppError('Akses ditolak', 403));

        const res = createFakeRes();
        await checklistController.getByID(createFakeReq({ params: { checklist_harian_id: checklistId } }), res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });
});

describe('ChecklistHarianController.update', () => {
    it('mengembalikan response 200 dan meneruskan data ke service', async () => {
        mockChecklistService.update.mockResolvedValue(undefined);

        const res = createFakeRes();
        await checklistController.update(
            createFakeReq({ params: { checklist_harian_id: checklistId }, body: { nama_tugas: 'Pel Lantai' } }),
            res
        );

        expect(mockChecklistService.update).toHaveBeenCalledWith(checklistId, { nama_tugas: 'Pel Lantai' });
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('mengembalikan 400 dan tidak memanggil service jika id bukan uuid', async () => {
        const res = createFakeRes();
        await checklistController.update(
            createFakeReq({ params: { checklist_harian_id: 'bukan-uuid' }, body: { nama_tugas: 'Pel' } }),
            res
        );

        expect(mockChecklistService.update).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('mengembalikan 500 jika terjadi error yang tidak terduga', async () => {
        mockChecklistService.update.mockRejectedValue(new Error('boom'));

        const res = createFakeRes();
        await checklistController.update(
            createFakeReq({ params: { checklist_harian_id: checklistId }, body: { nama_tugas: 'Pel' } }),
            res
        );

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });
});

describe('ChecklistHarianController.delete', () => {
    it('mengembalikan response 200 setelah berhasil menghapus', async () => {
        mockChecklistService.delete.mockResolvedValue(undefined);

        const res = createFakeRes();
        await checklistController.delete(createFakeReq({ params: { checklist_harian_id: checklistId } }), res);

        expect(mockChecklistService.delete).toHaveBeenCalledWith(checklistId);
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('mengembalikan 400 dan tidak memanggil service jika id bukan uuid', async () => {
        const res = createFakeRes();
        await checklistController.delete(createFakeReq({ params: { checklist_harian_id: 'bukan-uuid' } }), res);

        expect(mockChecklistService.delete).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('mengembalikan 500 jika terjadi error yang tidak terduga', async () => {
        mockChecklistService.delete.mockRejectedValue(new Error('boom'));

        const res = createFakeRes();
        await checklistController.delete(createFakeReq({ params: { checklist_harian_id: checklistId } }), res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });
});
