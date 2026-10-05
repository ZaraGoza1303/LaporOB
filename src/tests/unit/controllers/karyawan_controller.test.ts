import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";
import type { Request, Response } from "express";
import { KaryawanController } from "../../../controllers/karyawan_controller";
import type { IKaryawanService } from "../../../services/karyawan_service.interface";
import type { IStorageService } from "../../../services/storage_service.interface";
import { AppError } from "../../../utils/error";
import * as validateFileUtils from "../../../utils/validate_file";

const mockKaryawanService = mockDeep<IKaryawanService>();
const mockStorageService = mockDeep<IStorageService>();

const karyawanController = new KaryawanController(mockKaryawanService, mockStorageService);

beforeEach(() => {
    mockReset(mockKaryawanService);
    mockReset(mockStorageService);
    vi.restoreAllMocks();
});

const userId = 'e2fbdc6f-ec0d-4547-a51d-a81b69741ed2';
const kategoriId = '11111111-1111-4111-8111-111111111111';
const lantaiId = '22222222-2222-4222-8222-222222222222';
const ruanganId = '33333333-3333-4333-8333-333333333333';

// Fake req/res express.
function createFakeReq(overrides?: {
    body?: Record<string, unknown>;
    files?: unknown[];
    user?: { id: string; username: string; role: string };
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

function createFailedRes() {
    return {
        errors: undefined,
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

function createFakeFile(): Express.Multer.File {
    return {
        fieldname: 'foto_masalah',
        originalname: 'foto.png',
        mimetype: 'image/png',
        size: 1000,
        buffer: Buffer.from('fake'),
    } as Express.Multer.File;
}

const validBody = {
    kategori_id: kategoriId,
    lantai_id: lantaiId,
    ruangan_id: ruanganId,
    deskripsi_kendala: 'AC bocor parah',
    prioritas: 'STANDARD',
};

describe('KaryawanController.getHomeStats', () => {
    it('mengembalikan home karyawan dengan response 200', async () => {
        const fakeHome = { karyawan: { nama_lengkap: 'Farhan' } };
        mockKaryawanService.getHomeStats.mockResolvedValue(fakeHome as never);

        const res = createFakeRes();
        await karyawanController.getHomeStats(
            createFakeReq({ user: { id: userId, username: 'farhan', role: 'karyawan' } }),
            res
        );

        expect(mockKaryawanService.getHomeStats).toHaveBeenCalledWith(userId);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(createSuccessfullRes(fakeHome));
    });

    it('meneruskan status code AppError dari service', async () => {
        mockKaryawanService.getHomeStats.mockRejectedValue(new AppError('Gagal', 422));

        const res = createFakeRes();
        await karyawanController.getHomeStats(
            createFakeReq({ user: { id: userId, username: 'farhan', role: 'karyawan' } }),
            res
        );

        expect(res.status).toHaveBeenCalledWith(422);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });

    it('mengembalikan 500 jika terjadi error yang tidak terduga', async () => {
        mockKaryawanService.getHomeStats.mockRejectedValue(new Error('boom'));

        const res = createFakeRes();
        await karyawanController.getHomeStats(
            createFakeReq({ user: { id: userId, username: 'farhan', role: 'karyawan' } }),
            res
        );

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });
});

describe('KaryawanController.createReport', () => {
    it('membuat laporan dengan foto dan response 201', async () => {
        vi.spyOn(validateFileUtils, 'validateImageFile').mockResolvedValue({ ok: true } as never);
        vi.spyOn(validateFileUtils, 'compressImageIfNeeded').mockResolvedValue(createFakeFile() as never);
        mockStorageService.uploadFile.mockResolvedValue('uploads/foto.png');
        mockKaryawanService.createReport.mockResolvedValue(undefined);

        const res = createFakeRes();
        await karyawanController.createReport(
            createFakeReq({
                user: { id: userId, username: 'farhan', role: 'karyawan' },
                body: validBody,
                files: [createFakeFile()],
            }),
            res
        );

        expect(mockKaryawanService.createReport).toHaveBeenCalledWith(
            userId,
            expect.objectContaining({ deskripsi_kendala: 'AC bocor parah', foto_masalah: ['uploads/foto.png'] })
        );
        expect(res.status).toHaveBeenCalledWith(201);
    });

    it('mengembalikan 400 dan tidak memanggil service jika body tidak valid', async () => {
        const res = createFakeRes();
        await karyawanController.createReport(
            createFakeReq({
                user: { id: userId, username: 'farhan', role: 'karyawan' },
                body: { ...validBody, deskripsi_kendala: '' },
                files: [createFakeFile()],
            }),
            res
        );

        expect(mockKaryawanService.createReport).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('mengembalikan 400 jika foto masalah tidak diupload', async () => {
        const res = createFakeRes();
        await karyawanController.createReport(
            createFakeReq({
                user: { id: userId, username: 'farhan', role: 'karyawan' },
                body: validBody,
                files: [],
            }),
            res
        );

        expect(mockKaryawanService.createReport).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('mengembalikan 400 jika file bukan gambar valid', async () => {
        vi.spyOn(validateFileUtils, 'validateImageFile').mockResolvedValue({ ok: false, message: 'Format gambar harus JPEG' } as never);

        const res = createFakeRes();
        await karyawanController.createReport(
            createFakeReq({
                user: { id: userId, username: 'farhan', role: 'karyawan' },
                body: validBody,
                files: [createFakeFile()],
            }),
            res
        );

        expect(mockKaryawanService.createReport).not.toHaveBeenCalled();
        expect(mockStorageService.uploadFile).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('mengembalikan 500 jika terjadi error yang tidak terduga', async () => {
        vi.spyOn(validateFileUtils, 'validateImageFile').mockResolvedValue({ ok: true } as never);
        vi.spyOn(validateFileUtils, 'compressImageIfNeeded').mockResolvedValue(createFakeFile() as never);
        mockStorageService.uploadFile.mockResolvedValue('uploads/foto.png');
        mockKaryawanService.createReport.mockRejectedValue(new Error('boom'));

        const res = createFakeRes();
        await karyawanController.createReport(
            createFakeReq({
                user: { id: userId, username: 'farhan', role: 'karyawan' },
                body: validBody,
                files: [createFakeFile()],
            }),
            res
        );

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });
});
