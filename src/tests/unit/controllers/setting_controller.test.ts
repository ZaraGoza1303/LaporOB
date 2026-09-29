import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";
import type { Request, Response } from "express";
import { SettingController } from "../../../controllers/setting_controller";
import type { IAppSettingService, AppSettingMap } from "../../../services/appSetting_service.interface";
import { AppError } from "../../../utils/error";

const mockSettingService = mockDeep<IAppSettingService>();

const settingController = new SettingController(mockSettingService);

beforeEach(() => {
    mockReset(mockSettingService);
});

// Fungsi generate fake data dan bisa juga override
function createFakeSettings(overrides?: Partial<AppSettingMap>): AppSettingMap {
    return {
        app_name: 'LaporOB',
        company_name: 'PT WGS',
        logo_url: 'uploads/logo-baru.png',
        ...overrides,
    };
}

// Fake req/res express.
function createFakeReq(overrides?: {
    body?: Record<string, unknown>;
}) {
    return { body: {}, ...overrides } as unknown as Request;
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

describe('SettingController.getAll', () => {
    it('mengembalikan pengaturan apa adanya dari service', async () => {
        mockSettingService.getAll.mockResolvedValue(createFakeSettings());

        const res = createFakeRes();
        await settingController.getAll(createFakeReq(), res);

        expect(mockSettingService.getAll).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            createSuccessfullRes(createFakeSettings())
        );
    });

    it('mengembalikan logo_url null jika belum pernah disimpan', async () => {
        mockSettingService.getAll.mockResolvedValue(createFakeSettings({ logo_url: null }));

        const res = createFakeRes();
        await settingController.getAll(createFakeReq(), res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            createSuccessfullRes(createFakeSettings({ logo_url: null }))
        );
    });

    it('meneruskan status code AppError dari service', async () => {
        mockSettingService.getAll.mockRejectedValue(new AppError('Akses ditolak', 403));

        const res = createFakeRes();
        await settingController.getAll(createFakeReq(), res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });

    it('mengembalikan 500 jika terjadi error yang tidak terduga', async () => {
        mockSettingService.getAll.mockRejectedValue(new Error('boom'));

        const res = createFakeRes();
        await settingController.getAll(createFakeReq(), res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });
});

describe('SettingController.getPublic', () => {
    it('mengembalikan branding apa adanya dari service', async () => {
        mockSettingService.getAll.mockResolvedValue(createFakeSettings());

        const res = createFakeRes();
        await settingController.getPublic(createFakeReq(), res);

        expect(mockSettingService.getAll).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(createSuccessfullRes(createFakeSettings()));
    });

    it('mengembalikan 500 jika terjadi error yang tidak terduga', async () => {
        mockSettingService.getAll.mockRejectedValue(new Error('boom'));

        const res = createFakeRes();
        await settingController.getPublic(createFakeReq(), res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });
});

describe('SettingController.upsert', () => {
    it('menyimpan pengaturan lalu mengembalikan hasil terbaru', async () => {
        mockSettingService.upsert.mockResolvedValue(undefined);
        mockSettingService.getAll.mockResolvedValue(createFakeSettings());

        const res = createFakeRes();
        await settingController.upsert(
            createFakeReq({ body: { app_name: 'LaporOB', company_name: 'PT WGS' } }),
            res
        );

        expect(mockSettingService.upsert).toHaveBeenCalledWith({ app_name: 'LaporOB', company_name: 'PT WGS' });
        expect(mockSettingService.getAll).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(createSuccessfullRes(createFakeSettings()));
    });

    it('mengembalikan 400 dan tidak memanggil service jika body tidak valid', async () => {
        const res = createFakeRes();
        await settingController.upsert(createFakeReq({ body: { app_name: '' } }), res);

        expect(mockSettingService.upsert).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ success: false, message: "Validation Failed" })
        );
    });

    it('meneruskan status code AppError dari service', async () => {
        mockSettingService.upsert.mockRejectedValue(new AppError('Pengaturan tidak valid', 422));

        const res = createFakeRes();
        await settingController.upsert(createFakeReq({ body: { app_name: 'LaporOB' } }), res);

        expect(res.status).toHaveBeenCalledWith(422);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });

    it('mengembalikan 500 jika terjadi error yang tidak terduga', async () => {
        mockSettingService.upsert.mockRejectedValue(new Error('boom'));

        const res = createFakeRes();
        await settingController.upsert(createFakeReq({ body: { app_name: 'LaporOB' } }), res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });
});
