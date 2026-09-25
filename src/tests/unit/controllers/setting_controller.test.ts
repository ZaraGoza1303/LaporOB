import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";
import type { Request, Response } from "express";
import { SettingController } from "../../../controllers/setting_controller";
import type { IAppSettingService, AppSettingMap } from "../../../services/appSetting_service.interface";
import type { IStorageService } from "../../../services/storage_service.interface";
import { AppError } from "../../../utils/error";

const mockSettingService = mockDeep<IAppSettingService>();
const mockStorageService = mockDeep<IStorageService>();

const settingController = new SettingController(mockSettingService, mockStorageService);

beforeEach(() => {
    mockReset(mockSettingService);
    mockReset(mockStorageService);
    // Bikin resolveFileUrl deterministik 
    vi.stubEnv("BACKEND_BASE_URL", "http://localhost:8000");
});

const baseUrl = "http://localhost:8000";

// PNG asli 8 byte signature + awal IHDR. Cukup buat file type mendeteksi png
// dan karena size <= 1MB, compressImageIfNeeded langsung return (sharp tidak jalan)
const PNG_SIGNATURE = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
]);

// Fungsi generate fake data dan bisa juga override
function createFakeSettings(overrides?: Partial<AppSettingMap>): AppSettingMap {
    return {
        app_name: 'LaporOB',
        company_name: 'PT WGS',
        logo_url: 'uploads/logo-baru.png',
        ...overrides,
    };
}

// Fungsi generate fake data dan bisa juga override
function createFakeLogoFile(overrides?: Partial<Express.Multer.File>): Express.Multer.File {
    const buffer = overrides?.buffer ?? PNG_SIGNATURE;
    return {
        fieldname: "logo",
        originalname: "logo.png",
        encoding: "7bit",
        mimetype: "image/png",
        size: buffer.length,
        buffer: buffer,
        destination: "",
        filename: "",
        path: "",
        stream: null,
        ...overrides,
    } as unknown as Express.Multer.File;
}

// Fake req/res express.
function createFakeReq(overrides?: {
    body?: Record<string, unknown>;
    files?: Express.Multer.File[];
}) {
    return { body: {}, files: [], ...overrides } as unknown as Request;
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
    it('mengembalikan pengaturan dengan logo_url yang di-resolve jadi URL absolut', async () => {
        mockSettingService.getAll.mockResolvedValue(createFakeSettings());

        const res = createFakeRes();
        await settingController.getAll(createFakeReq(), res);

        expect(mockSettingService.getAll).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            createSuccessfullRes({
                app_name: 'LaporOB',
                company_name: 'PT WGS',
                logo_url: `${baseUrl}/uploads/logo-baru.png`,
            })
        );
    });

    it('tidak mengubah logo_url yang sudah berupa URL absolut', async () => {
        mockSettingService.getAll.mockResolvedValue(
            createFakeSettings({ logo_url: 'https://cdn.laporob.com/logo.png' })
        );

        const res = createFakeRes();
        await settingController.getAll(createFakeReq(), res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            createSuccessfullRes({
                app_name: 'LaporOB',
                company_name: 'PT WGS',
                logo_url: 'https://cdn.laporob.com/logo.png',
            })
        );
    });

    it('mengembalikan logo_url null jika logo belum pernah disimpan', async () => {
        mockSettingService.getAll.mockResolvedValue(createFakeSettings({ logo_url: null }));

        const res = createFakeRes();
        await settingController.getAll(createFakeReq(), res);

        expect(res.json).toHaveBeenCalledWith(
            createSuccessfullRes({
                app_name: 'LaporOB',
                company_name: 'PT WGS',
                logo_url: null,
            })
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
    it('mengembalikan branding dengan logo_url yang di-resolve jadi URL absolut', async () => {
        mockSettingService.getAll.mockResolvedValue(createFakeSettings());

        const res = createFakeRes();
        await settingController.getPublic(createFakeReq(), res);

        expect(mockSettingService.getAll).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            createSuccessfullRes({
                app_name: 'LaporOB',
                company_name: 'PT WGS',
                logo_url: `${baseUrl}/uploads/logo-baru.png`,
            })
        );
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
    it('menyimpan pengaturan tanpa file logo', async () => {
        mockSettingService.getAll.mockResolvedValue(createFakeSettings());

        const res = createFakeRes();
        await settingController.upsert(
            createFakeReq({ body: { app_name: 'LaporOB', company_name: 'PT WGS' } }),
            res
        );

        expect(mockStorageService.uploadFile).not.toHaveBeenCalled();
        expect(mockStorageService.updateFile).not.toHaveBeenCalled();
        expect(mockSettingService.upsert).toHaveBeenCalledWith({ app_name: 'LaporOB', company_name: 'PT WGS' });
        expect(mockSettingService.getAll).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            createSuccessfullRes({
                app_name: 'LaporOB',
                company_name: 'PT WGS',
                logo_url: `${baseUrl}/uploads/logo-baru.png`,
            })
        );
    });

    it('mengupload logo baru jika belum ada logo lama', async () => {
        const logoFile = createFakeLogoFile();

        mockSettingService.getStoredLogoUrl.mockResolvedValue(null);
        mockStorageService.uploadFile.mockResolvedValue('uploads/logo-baru.png');
        mockSettingService.getAll.mockResolvedValue(createFakeSettings());

        const res = createFakeRes();
        await settingController.upsert(createFakeReq({ body: { app_name: 'LaporOB' }, files: [logoFile] }), res);

        expect(mockStorageService.uploadFile).toHaveBeenCalledWith(logoFile);
        expect(mockStorageService.updateFile).not.toHaveBeenCalled();
        expect(mockSettingService.upsert).toHaveBeenCalledWith({
            app_name: 'LaporOB',
            logo_url: 'uploads/logo-baru.png',
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            createSuccessfullRes({
                app_name: 'LaporOB',
                company_name: 'PT WGS',
                logo_url: `${baseUrl}/uploads/logo-baru.png`,
            })
        );
    });

    it('mengganti file logo lama jika logo lama bukan berasal dari env LOGO_URL', async () => {
        const logoFile = createFakeLogoFile();

        mockSettingService.getStoredLogoUrl.mockResolvedValue('uploads/logo-lama.png');
        mockStorageService.updateFile.mockResolvedValue('uploads/logo-baru.png');
        mockSettingService.getAll.mockResolvedValue(createFakeSettings());

        const res = createFakeRes();
        await settingController.upsert(createFakeReq({ files: [logoFile] }), res);

        expect(mockStorageService.updateFile).toHaveBeenCalledWith(logoFile, 'uploads/logo-lama.png');
        expect(mockStorageService.uploadFile).not.toHaveBeenCalled();
        expect(mockSettingService.upsert).toHaveBeenCalledWith({ logo_url: 'uploads/logo-baru.png' });
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('mengupload logo baru jika logo lama sama dengan default LOGO_URL dari env', async () => {
        vi.stubEnv("LOGO_URL", "/uploads/wgs-logo.png");
        const logoFile = createFakeLogoFile();

        mockSettingService.getStoredLogoUrl.mockResolvedValue('/uploads/wgs-logo.png');
        mockStorageService.uploadFile.mockResolvedValue('uploads/logo-baru.png');
        mockSettingService.getAll.mockResolvedValue(createFakeSettings());

        const res = createFakeRes();
        await settingController.upsert(createFakeReq({ files: [logoFile] }), res);

        expect(mockStorageService.uploadFile).toHaveBeenCalledWith(logoFile);
        expect(mockStorageService.updateFile).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('mengupload logo baru jika logo lama sama dengan bentuk absolut dari LOGO_URL env', async () => {
        vi.stubEnv("LOGO_URL", "/uploads/wgs-logo.png");
        const logoFile = createFakeLogoFile();

        mockSettingService.getStoredLogoUrl.mockResolvedValue(`${baseUrl}/uploads/wgs-logo.png`);
        mockStorageService.uploadFile.mockResolvedValue('uploads/logo-baru.png');
        mockSettingService.getAll.mockResolvedValue(createFakeSettings());

        const res = createFakeRes();
        await settingController.upsert(createFakeReq({ files: [logoFile] }), res);

        expect(mockStorageService.uploadFile).toHaveBeenCalledWith(logoFile);
        expect(mockStorageService.updateFile).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('mengabaikan logo_url kosong dari FormData jika file logo dikirim', async () => {
        const logoFile = createFakeLogoFile();

        mockSettingService.getStoredLogoUrl.mockResolvedValue(null);
        mockStorageService.uploadFile.mockResolvedValue('uploads/logo-baru.png');
        mockSettingService.getAll.mockResolvedValue(createFakeSettings());

        const res = createFakeRes();
        await settingController.upsert(
            createFakeReq({ body: { app_name: 'LaporOB', logo_url: '' }, files: [logoFile] }),
            res
        );

        expect(mockSettingService.upsert).toHaveBeenCalledWith({
            app_name: 'LaporOB',
            logo_url: 'uploads/logo-baru.png',
        });
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('mengembalikan 400 jika file yang diupload bukan gambar', async () => {
        const logoFile = createFakeLogoFile({ buffer: Buffer.from('bukan gambar'), size: 12 });

        const res = createFakeRes();
        await settingController.upsert(createFakeReq({ files: [logoFile] }), res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: false,
                message: "Format gambar harus JPEG, JPG, WEBP, atau PNG asli",
            })
        );
        expect(mockStorageService.uploadFile).not.toHaveBeenCalled();
        expect(mockStorageService.updateFile).not.toHaveBeenCalled();
        expect(mockSettingService.upsert).not.toHaveBeenCalled();
    });

    it('mengembalikan 500 jika gambar gagal dikompresi', async () => {
        // size > 1MB bikin sharp jalan, tapi buffer nya cuma header PNG 16 byte
        // sehingga sharp gagal parse dan controller balikin pesan error kompresi
        const logoFile = createFakeLogoFile({ size: 2 * 1024 * 1024 });

        const res = createFakeRes();
        await settingController.upsert(createFakeReq({ files: [logoFile] }), res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ success: false, message: "Gagal memproses gambar logo" })
        );
        expect(mockStorageService.uploadFile).not.toHaveBeenCalled();
    });

    it('mengembalikan 400 dan tidak memanggil service jika logo_url tidak valid', async () => {
        const res = createFakeRes();
        await settingController.upsert(createFakeReq({ body: { logo_url: 'javascript:alert(1)' } }), res);

        expect(mockSettingService.upsert).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            createFailedRes({
                errorMsg: { "logo_url": ["URL logo harus berupa URL http(s) absolut atau path file di uploads/"] },
            })
        );
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

    it('mengembalikan 500 jika penyimpanan file logo gagal', async () => {
        const logoFile = createFakeLogoFile();

        mockSettingService.getStoredLogoUrl.mockResolvedValue(null);
        mockStorageService.uploadFile.mockRejectedValue(new Error('disk penuh'));

        const res = createFakeRes();
        await settingController.upsert(createFakeReq({ files: [logoFile] }), res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
        expect(mockSettingService.upsert).not.toHaveBeenCalled();
    });

    it('meneruskan status code AppError dari service', async () => {
        mockSettingService.upsert.mockRejectedValue(new AppError('Pengaturan tidak valid', 422));

        const res = createFakeRes();
        await settingController.upsert(createFakeReq({ body: { app_name: 'LaporOB' } }), res);

        expect(res.status).toHaveBeenCalledWith(422);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });

    it('mengembalikan 500 jika terjadi error yang tidak terduga', async () => {
        mockSettingService.getAll.mockRejectedValue(new Error('boom'));

        const res = createFakeRes();
        await settingController.upsert(createFakeReq({ body: { app_name: 'LaporOB' } }), res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });
});
