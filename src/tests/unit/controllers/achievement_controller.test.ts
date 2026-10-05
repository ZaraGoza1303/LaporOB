import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";
import type { Request, Response } from "express";
import { AchievementController } from "../../../controllers/achievement_controller";
import type { IAchievementService } from "../../../services/achievement_service.interface";
import type { AchievementRes } from "../../../types/achievement";
import { AppError } from "../../../utils/error";

const mockAchievementService = mockDeep<IAchievementService>();

const achievementController = new AchievementController(mockAchievementService);

beforeEach(() => {
    mockReset(mockAchievementService);
});

const achievementId = '3f2a1b7c-9d4e-4a51-8c6f-1d2e3f4a5b6c';
const obId = 'e2fbdc6f-ec0d-4547-a51d-a81b69741ed2';

// Fungsi generate fake data dan bisa juga override
function createFakeAchievement(overrides?: Partial<AchievementRes>): AchievementRes {
    return {
        id: achievementId,
        nama: 'Rajin Membersihkan',
        deskripsi: 'Selesaikan 5 tugas',
        tipe: 'KEYWORD',
        keyword: ['bersih'],
        threshold: 5,
        response_time_threshold_seconds: null,
        icon: null,
        is_active: true,
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

describe('AchievementController.create', () => {
    it('mengembalikan achievement baru dengan response 201', async () => {
        const fakeAchievement = createFakeAchievement();
        mockAchievementService.create.mockResolvedValue(fakeAchievement);

        const res = createFakeRes();
        await achievementController.create(
            createFakeReq({ body: { nama: 'Rajin Membersihkan', keyword: ['bersih'], threshold: 5 } }),
            res
        );

        expect(mockAchievementService.create).toHaveBeenCalledWith(
            expect.objectContaining({ nama: 'Rajin Membersihkan' })
        );
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(createSuccessfullRes(fakeAchievement));
    });

    it('mengembalikan 400 dan tidak memanggil service jika body tidak valid', async () => {
        const res = createFakeRes();
        await achievementController.create(createFakeReq({ body: { nama: '' } }), res);

        expect(mockAchievementService.create).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            createFailedRes({ errorMsg: { "nama": ["Nama achievement wajib diisi"] } })
        );
    });

    it('mengembalikan 400 dan tidak memanggil service jika request body kosong', async () => {
        const res = createFakeRes();
        await achievementController.create(createFakeReq({ body: undefined }), res);

        expect(mockAchievementService.create).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });

    it('mengembalikan 500 jika terjadi error yang tidak terduga', async () => {
        mockAchievementService.create.mockRejectedValue(new Error('boom'));

        const res = createFakeRes();
        await achievementController.create(
            createFakeReq({ body: { nama: 'Rajin Membersihkan' } }),
            res
        );

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });
});

describe('AchievementController.getAll', () => {
    it('mengembalikan daftar achievement dengan response 200', async () => {
        const fakeAchievements = [createFakeAchievement()];
        mockAchievementService.getAll.mockResolvedValue(fakeAchievements);

        const res = createFakeRes();
        await achievementController.getAll(createFakeReq(), res);

        expect(mockAchievementService.getAll).toHaveBeenCalledWith(false);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(createSuccessfullRes(fakeAchievements));
    });

    it('meneruskan include_inactive true ke service', async () => {
        mockAchievementService.getAll.mockResolvedValue([createFakeAchievement()]);

        const res = createFakeRes();
        await achievementController.getAll(createFakeReq({ query: { include_inactive: 'true' } }), res);

        expect(mockAchievementService.getAll).toHaveBeenCalledWith(true);
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('mengembalikan 500 jika terjadi error yang tidak terduga', async () => {
        mockAchievementService.getAll.mockRejectedValue(new Error('boom'));

        const res = createFakeRes();
        await achievementController.getAll(createFakeReq(), res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });
});

describe('AchievementController.getByID', () => {
    it('mengembalikan detail achievement dengan response 200', async () => {
        const fakeAchievement = createFakeAchievement();
        mockAchievementService.getByID.mockResolvedValue(fakeAchievement);

        const res = createFakeRes();
        await achievementController.getByID(createFakeReq({ params: { achievement_id: achievementId } }), res);

        expect(mockAchievementService.getByID).toHaveBeenCalledWith(achievementId);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(createSuccessfullRes(fakeAchievement));
    });

    it('mengembalikan 400 dan tidak memanggil service jika id bukan uuid', async () => {
        const res = createFakeRes();
        await achievementController.getByID(createFakeReq({ params: { achievement_id: 'bukan-uuid' } }), res);

        expect(mockAchievementService.getByID).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            createFailedRes({ errorMsg: { "achievement_id": ["Format achievement_id harus UUID yang valid"] } })
        );
    });

    it('mengembalikan 404 jika achievement tidak ditemukan', async () => {
        mockAchievementService.getByID.mockResolvedValue(null);

        const res = createFakeRes();
        await achievementController.getByID(createFakeReq({ params: { achievement_id: achievementId } }), res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });
});

describe('AchievementController.getMyAchievements', () => {
    it('mengembalikan achievement milik user login dengan response 200', async () => {
        const fakeItems = [createFakeAchievement()];
        mockAchievementService.getObAchievements.mockResolvedValue(fakeItems as never);

        const res = createFakeRes();
        await achievementController.getMyAchievements(
            createFakeReq({ user: { id: obId, username: 'farhan_ob', role: 'ob' } }),
            res
        );

        expect(mockAchievementService.getObAchievements).toHaveBeenCalledWith(obId);
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('mengembalikan 401 dan tidak memanggil service jika user tidak terautentikasi', async () => {
        const res = createFakeRes();
        await achievementController.getMyAchievements(createFakeReq(), res);

        expect(mockAchievementService.getObAchievements).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
    });

    it('mengembalikan 500 jika terjadi error yang tidak terduga', async () => {
        mockAchievementService.getObAchievements.mockRejectedValue(new Error('boom'));

        const res = createFakeRes();
        await achievementController.getMyAchievements(
            createFakeReq({ user: { id: obId, username: 'farhan_ob', role: 'ob' } }),
            res
        );

        expect(res.status).toHaveBeenCalledWith(500);
    });
});
