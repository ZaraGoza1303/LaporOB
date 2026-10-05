import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";
import { KolaborasiRepository } from "../../../repositories/kolaborasi_repository";
import { KolaborasiService } from "../../../services/kolaborasi_service";
import type { ILaporanService } from "../../../services/laporan_service.interface";
import type { INotificationService } from "../../../services/notification_service.interface";
import type { PrismaClient, KolaborasiLaporan } from "../../../generated/prisma/client";
import { AppError } from "../../../utils/error";

const mockDB = mockDeep<PrismaClient>();
const mockLaporanService = mockDeep<ILaporanService>();
const mockNotificationService = mockDeep<INotificationService>();

const mockKolaborasiRepo = new KolaborasiRepository(mockDB);
const mockKolaborasiService = new KolaborasiService(mockKolaborasiRepo, mockLaporanService, mockNotificationService);

beforeEach(() => {
    mockReset(mockDB);
    mockReset(mockLaporanService);
    mockReset(mockNotificationService);
    vi.restoreAllMocks();
});

const laporanId = 'e2fbdc6f-ec0d-4547-a51d-a81b69741ed2';
const obId = '852a6e0e-1bcf-4578-b93b-46f893544bfc';
const primaryObId = '11111111-1111-4111-8111-111111111111';
const kolaborasiId = '3f2a1b7c-9d4e-4a51-8c6f-1d2e3f4a5b6c';

// Fungsi generate fake data dan bisa juga override
function createFakeKolaborasi(overrides?: Partial<KolaborasiLaporan>): KolaborasiLaporan {
    return {
        id: kolaborasiId,
        laporan_id: laporanId,
        ob_id: obId,
        status: 'PENDING',
        created_at: new Date('2026-01-01T00:00:00Z'),
        updated_at: new Date('2026-01-01T00:00:00Z'),
        ...overrides,
    };
}

function createFakeLaporan(overrides?: Record<string, unknown>) {
    return {
        id: laporanId,
        ob_id: primaryObId,
        is_kolaborasi_open: true,
        ...overrides,
    };
}

describe('KolaborasiService.gabung', () => {
    it('membuat permintaan gabung dan mengirim notifikasi ke ob utama', async () => {
        mockLaporanService.getReportDetailWithRelations.mockResolvedValue(createFakeLaporan() as never);
        mockDB.kolaborasiLaporan.findUnique.mockResolvedValue(null);
        mockDB.kolaborasiLaporan.create.mockResolvedValue(createFakeKolaborasi());

        const data = await mockKolaborasiService.gabung(laporanId, obId);

        expect(mockDB.kolaborasiLaporan.create).toHaveBeenCalledWith({
            data: { laporan_id: laporanId, ob_id: obId, status: 'PENDING' },
        });
        expect(mockNotificationService.sendNotification).toHaveBeenCalledWith(
            expect.objectContaining({ penerima_id: primaryObId, pengirim_id: obId })
        );
        expect(data.laporan_id).toBe(laporanId);
    });

    it('melempar AppError 404 jika laporan tidak ditemukan', async () => {
        mockLaporanService.getReportDetailWithRelations.mockResolvedValue(null);

        await expect(mockKolaborasiService.gabung(laporanId, obId)).rejects.toThrow(
            new AppError('Laporan tidak ditemukan', 404)
        );
    });

    it('melempar AppError 400 jika ob sudah menjadi ob utama', async () => {
        mockLaporanService.getReportDetailWithRelations.mockResolvedValue(
            createFakeLaporan({ ob_id: obId }) as never
        );

        await expect(mockKolaborasiService.gabung(laporanId, obId)).rejects.toThrow(
            new AppError('Anda sudah menjadi OB utama laporan ini', 400)
        );
    });

    it('melempar AppError 409 jika sudah pernah meminta gabung', async () => {
        mockLaporanService.getReportDetailWithRelations.mockResolvedValue(createFakeLaporan() as never);
        mockDB.kolaborasiLaporan.findUnique.mockResolvedValue(createFakeKolaborasi({ status: 'PENDING' }));

        await expect(mockKolaborasiService.gabung(laporanId, obId)).rejects.toThrow(
            new AppError('Permintaan gabung sudah dikirim, tunggu persetujuan', 409)
        );
    });
});

describe('KolaborasiService.setujui', () => {
    it('menyetujui permintaan dan mengirim notifikasi ke peminta', async () => {
        mockLaporanService.getReportDetailWithRelations.mockResolvedValue(createFakeLaporan() as never);
        mockDB.kolaborasiLaporan.findUnique.mockResolvedValue(createFakeKolaborasi());
        mockDB.kolaborasiLaporan.update.mockResolvedValue(createFakeKolaborasi({ status: 'APPROVED' }));

        await mockKolaborasiService.setujui(kolaborasiId, laporanId, primaryObId);

        expect(mockDB.kolaborasiLaporan.update).toHaveBeenCalledWith({
            where: { id: kolaborasiId },
            data: { status: 'APPROVED' },
        });
        expect(mockNotificationService.sendNotification).toHaveBeenCalled();
    });

    it('melempar AppError 403 jika bukan ob utama', async () => {
        mockLaporanService.getReportDetailWithRelations.mockResolvedValue(
            createFakeLaporan({ ob_id: 'ob-lain' }) as never
        );

        await expect(mockKolaborasiService.setujui(kolaborasiId, laporanId, primaryObId)).rejects.toThrow(
            new AppError('Hanya OB utama yang bisa menyetujui', 403)
        );
    });
});

describe('KolaborasiService.keluar', () => {
    it('anggota keluar dari kolaborasi dan mengirim notifikasi', async () => {
        mockLaporanService.getReportDetailWithRelations.mockResolvedValue(createFakeLaporan() as never);
        mockDB.kolaborasiLaporan.findFirst.mockResolvedValue(createFakeKolaborasi({ status: 'APPROVED' }));
        mockDB.kolaborasiLaporan.delete.mockResolvedValue(createFakeKolaborasi());

        await mockKolaborasiService.keluar(laporanId, obId);

        expect(mockDB.kolaborasiLaporan.delete).toHaveBeenCalledWith({ where: { id: kolaborasiId } });
        expect(mockNotificationService.sendNotification).toHaveBeenCalled();
    });

    it('melempar AppError 400 jika ob utama mencoba keluar', async () => {
        mockLaporanService.getReportDetailWithRelations.mockResolvedValue(
            createFakeLaporan({ ob_id: obId }) as never
        );

        await expect(mockKolaborasiService.keluar(laporanId, obId)).rejects.toThrow(
            new AppError('OB utama tidak bisa keluar, gunakan batalkan laporan', 400)
        );
    });
});

describe('KolaborasiService.isKolaborator', () => {
    it('mengembalikan true jika ob sudah approved', async () => {
        mockDB.kolaborasiLaporan.findUnique.mockResolvedValue(
            createFakeKolaborasi({ status: 'APPROVED' })
        );

        const data = await mockKolaborasiService.isKolaborator(laporanId, obId);

        expect(data).toBe(true);
    });

    it('mengembalikan false jika belum tergabung', async () => {
        mockDB.kolaborasiLaporan.findUnique.mockResolvedValue(null);

        const data = await mockKolaborasiService.isKolaborator(laporanId, obId);

        expect(data).toBe(false);
    });
});
