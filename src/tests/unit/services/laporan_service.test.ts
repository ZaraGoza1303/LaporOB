import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";
import { PrismaClient } from "../../../generated/prisma/client";
import { LaporanRepository } from "../../../repositories/laporan_repository";
import { LaporanService } from "../../../services/laporan_service";
import type { INotificationService } from "../../../services/notification_service.interface";
import type { IUsersService } from "../../../services/users_service.interface";
import type { ISkillService } from "../../../services/skill_service.interface";
import type { IAchievementService } from "../../../services/achievement_service.interface";
import { AppError } from "../../../utils/error";

const mockDB = mockDeep<PrismaClient>();
const mockNotificationService = mockDeep<INotificationService>();
const mockUsersService = mockDeep<IUsersService>();
const mockSkillService = mockDeep<ISkillService>();
const mockAchievementService = mockDeep<IAchievementService>();

const mockLaporanRepo = new LaporanRepository(mockDB);
const mockLaporanService = new LaporanService(
    mockLaporanRepo,
    mockNotificationService,
    mockUsersService,
    mockSkillService,
    mockAchievementService
);

beforeEach(() => {
    mockReset(mockDB);
    mockReset(mockNotificationService);
    mockReset(mockUsersService);
    mockReset(mockSkillService);
    mockReset(mockAchievementService);
    vi.restoreAllMocks();
});

const laporanId = '3f2a1b7c-9d4e-4a51-8c6f-1d2e3f4a5b6c';
const obId = 'e2fbdc6f-ec0d-4547-a51d-a81b69741ed2';
const pelaporId = '852a6e0e-1bcf-4578-b93b-46f893544bfc';

// Fungsi generate fake data dan bisa juga override
function createFakeDetail(overrides?: Record<string, unknown>) {
    return {
        id: laporanId,
        pelapor_id: pelaporId,
        ob_id: null,
        kategori: { nama_kategori: 'AC' },
        deskripsi_kendala: 'AC bocor',
        status: 'BELUM_DIKERJAKAN',
        prioritas: 'STANDARD',
        foto_masalah: [],
        lantai: { nomor_lantai: 1, lokasi: { nama_lokasi: 'Gedung WGS' } },
        pelapor: { nama_lengkap: 'Karyawan A' },
        ob: null,
        histori_pekerjaan: [],
        is_kolaborasi_open: false,
        catatan_kolaborasi: null,
        dikerjakan_at: null,
        selesai_at: null,
        created_at: new Date('2026-01-01T00:00:00Z'),
        ...overrides,
    };
}

describe('LaporanService.getReportDetail', () => {
    it('mengembalikan detail laporan yang sudah di-mapping', async () => {
        mockDB.laporan_karyawan.findUnique.mockResolvedValue(createFakeDetail() as never);

        const data = await mockLaporanService.getReportDetail(laporanId);

        expect(data.id).toBe(laporanId);
        expect(data.kategori).toBe('AC');
        expect(data.total_durasi).toBeNull();
    });

    it('menghitung total_durasi jika sudah dikerjakan dan selesai', async () => {
        mockDB.laporan_karyawan.findUnique.mockResolvedValue(
            createFakeDetail({
                dikerjakan_at: new Date('2026-01-01T08:00:00Z'),
                selesai_at: new Date('2026-01-01T09:00:00Z'),
            }) as never
        );

        const data = await mockLaporanService.getReportDetail(laporanId);

        expect(data.total_durasi).toBe(3600);
    });

    it('melempar AppError 404 jika laporan tidak ditemukan', async () => {
        mockDB.laporan_karyawan.findUnique.mockResolvedValue(null);

        await expect(mockLaporanService.getReportDetail(laporanId)).rejects.toThrow(AppError);
    });

    it('melempar AppError 403 jika ob mengakses laporan orang lain', async () => {
        mockDB.laporan_karyawan.findUnique.mockResolvedValue(
            createFakeDetail({ ob_id: 'ob-lain' }) as never
        );

        await expect(mockLaporanService.getReportDetail(laporanId, obId)).rejects.toThrow(
            new AppError('Anda tidak memiliki akses ke laporan ini', 403)
        );
    });
});

describe('LaporanService.insertReport', () => {
    it('membuat laporan dan mengembalikan id-nya', async () => {
        mockDB.laporan_karyawan.create.mockResolvedValue({ id: laporanId } as never);

        const data = await mockLaporanService.insertReport({ deskripsi_kendala: 'AC bocor' } as never);

        expect(data).toBe(laporanId);
    });
});

describe('LaporanService.patchLaporan', () => {
    it('mengisi dikerjakan_at saat status menjadi SEDANG_DIKERJAKAN', async () => {
        mockDB.laporan_karyawan.update.mockResolvedValue({} as never);

        await mockLaporanService.patchLaporan(laporanId, { status: 'SEDANG_DIKERJAKAN' } as never);

        expect(mockDB.laporan_karyawan.update).toHaveBeenCalledWith({
            where: { id: laporanId },
            data: expect.objectContaining({ status: 'SEDANG_DIKERJAKAN', dikerjakan_at: expect.any(Date) }),
        });
    });

    it('mengosongkan ob_id saat status DIBATALKAN', async () => {
        mockDB.laporan_karyawan.update.mockResolvedValue({} as never);

        await mockLaporanService.patchLaporan(laporanId, { status: 'DIBATALKAN' } as never);

        expect(mockDB.laporan_karyawan.update).toHaveBeenCalledWith({
            where: { id: laporanId },
            data: expect.objectContaining({ ob_id: null, dibatalkan_at: expect.any(Date) }),
        });
    });
});

describe('LaporanService.ambilLaporan', () => {
    it('ob berhasil mengambil laporan kosong dan mengirim notifikasi', async () => {
        mockDB.laporan_karyawan.findUnique.mockResolvedValue(createFakeDetail() as never);
        mockDB.laporan_karyawan.update.mockResolvedValue({} as never);

        await mockLaporanService.ambilLaporan(laporanId, obId);

        expect(mockDB.laporan_karyawan.update).toHaveBeenCalledWith({
            where: { id: laporanId },
            data: expect.objectContaining({ ob_id: obId }),
        });
        expect(mockNotificationService.sendNotification).toHaveBeenCalledWith(
            expect.objectContaining({ penerima_id: pelaporId, pengirim_id: obId })
        );
    });

    it('melempar AppError 409 jika laporan sudah diambil ob lain', async () => {
        mockDB.laporan_karyawan.findUnique.mockResolvedValue(
            createFakeDetail({ ob_id: 'ob-lain' }) as never
        );

        await expect(mockLaporanService.ambilLaporan(laporanId, obId)).rejects.toThrow(
            new AppError('Laporan sudah diambil oleh OB lain', 409)
        );
    });
});

describe('LaporanService.toggleKolaborasiOpen', () => {
    it('membuka kolaborasi dan mengirim notifikasi ke ob lain', async () => {
        mockDB.laporan_karyawan.findUnique.mockResolvedValue(
            createFakeDetail({ ob_id: obId }) as never
        );
        mockDB.laporan_karyawan.update.mockResolvedValue({} as never);
        mockUsersService.getByRole.mockResolvedValue([
            { id: obId },
            { id: 'ob-lain-1' },
            { id: 'ob-lain-2' },
        ] as never);

        await mockLaporanService.toggleKolaborasiOpen(laporanId, obId, true, 'butuh bantuan');

        expect(mockDB.laporan_karyawan.update).toHaveBeenCalledWith({
            where: { id: laporanId },
            data: { is_kolaborasi_open: true, catatan_kolaborasi: 'butuh bantuan' },
        });
        expect(mockNotificationService.sendBulkNotification).toHaveBeenCalledWith(
            expect.objectContaining({ penerima_ids: ['ob-lain-1', 'ob-lain-2'] })
        );
    });

    it('melempar AppError 403 jika bukan pemilik laporan', async () => {
        mockDB.laporan_karyawan.findUnique.mockResolvedValue(
            createFakeDetail({ ob_id: 'ob-lain' }) as never
        );

        await expect(
            mockLaporanService.toggleKolaborasiOpen(laporanId, obId, true)
        ).rejects.toThrow(
            new AppError('Hanya OB pemilik laporan yang bisa mengatur kolaborasi', 403)
        );
    });
});

describe('LaporanService.createHistoriPekerjaan', () => {
    it('menyelesaikan laporan dan memicu skill serta achievement', async () => {
        mockDB.laporan_karyawan.findUnique.mockResolvedValue(
            createFakeDetail({ ob_id: obId }) as never
        );
        mockDB.$transaction.mockResolvedValue([] as never);

        await mockLaporanService.createHistoriPekerjaan(laporanId, ['foto.png'], 'sudah beres', obId);

        expect(mockSkillService.prosesSkillOtomatisForOb).toHaveBeenCalledWith(obId);
        expect(mockAchievementService.prosesOtomatisUntukOb).toHaveBeenCalledWith(obId);
        expect(mockNotificationService.sendNotification).toHaveBeenCalled();
    });

    it('melempar AppError 403 jika bukan ob utama', async () => {
        mockDB.laporan_karyawan.findUnique.mockResolvedValue(
            createFakeDetail({ ob_id: 'ob-lain' }) as never
        );

        await expect(
            mockLaporanService.createHistoriPekerjaan(laporanId, [], 'catatan', obId)
        ).rejects.toThrow(
            new AppError('Hanya OB utama yang bisa menyelesaikan laporan', 403)
        );
    });
});
