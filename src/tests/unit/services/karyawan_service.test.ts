import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";
import { KaryawanService } from "../../../services/karyawan_service";
import type { IUsersService } from "../../../services/users_service.interface";
import type { ILaporanService } from "../../../services/laporan_service.interface";
import type { IKategoriService } from "../../../services/kategori_service.interface";
import type { INotificationService } from "../../../services/notification_service.interface";
import { AppError } from "../../../utils/error";

const mockUsersService = mockDeep<IUsersService>();
const mockLaporanService = mockDeep<ILaporanService>();
const mockKategoriService = mockDeep<IKategoriService>();
const mockNotificationService = mockDeep<INotificationService>();

const mockKaryawanService = new KaryawanService(
    mockUsersService,
    mockLaporanService,
    mockKategoriService,
    mockNotificationService
);

beforeEach(() => {
    mockReset(mockUsersService);
    mockReset(mockLaporanService);
    mockReset(mockKategoriService);
    mockReset(mockNotificationService);
    vi.restoreAllMocks();
});

const userId = 'e2fbdc6f-ec0d-4547-a51d-a81b69741ed2';

describe('KaryawanService.getKaryawanPerformanceStats', () => {
    it('mengembalikan jumlah laporan terkirim', async () => {
        mockLaporanService.getLaporanCountByUserId.mockResolvedValue(5);

        const data = await mockKaryawanService.getKaryawanPerformanceStats(userId);

        expect(mockLaporanService.getLaporanCountByUserId).toHaveBeenCalledWith(userId);
        expect(data).toEqual({ laporan_terkirim: 5 });
    });
});

describe('KaryawanService.getHomeStats', () => {
    it('mengembalikan home karyawan beserta kategori dan aktivitas', async () => {
        mockUsersService.getByID.mockResolvedValue({
            id: userId,
            nama_lengkap: 'Farhan Karyawan',
        } as never);
        mockLaporanService.getActivity.mockResolvedValue([
            {
                id: 'laporan-1',
                deskripsi_kendala: 'AC bocor',
                status: 'BELUM_DIKERJAKAN',
                foto_masalah: [],
                lantai: { lokasi: { nama_lokasi: 'Gedung WGS' }, nomor_lantai: 1 },
                created_at: new Date('2026-01-01T00:00:00Z'),
            },
        ] as never);
        mockKategoriService.getKategoriLimit.mockResolvedValue([{ id: 'kat-1' }] as never);

        const data = await mockKaryawanService.getHomeStats(userId);

        expect(mockKategoriService.getKategoriLimit).toHaveBeenCalledWith(6);
        expect(data.karyawan.nama_lengkap).toBe('Farhan Karyawan');
        expect(data.kategori).toHaveLength(1);
        expect(data.acitivity).toHaveLength(1);
    });

    it('melempar error jika karyawan tidak ditemukan', async () => {
        mockUsersService.getByID.mockResolvedValue(null);

        await expect(mockKaryawanService.getHomeStats(userId)).rejects.toThrow();
    });
});

describe('KaryawanService.createReport', () => {
    it('membuat laporan dan mengirim notifikasi ke semua ob', async () => {
        mockLaporanService.insertReport.mockResolvedValue('laporan-1');
        mockUsersService.getByRole.mockResolvedValue([{ id: 'ob-1' }, { id: 'ob-2' }] as never);

        await mockKaryawanService.createReport(userId, {
            lantai_id: 'lantai-1',
            ruangan_id: 'ruangan-1',
            kategori_id: 'kat-1',
            deskripsi_kendala: 'AC bocor',
            prioritas: 'STANDARD',
            foto_masalah: ['url1'],
        } as never);

        expect(mockLaporanService.insertReport).toHaveBeenCalledWith(
            expect.objectContaining({ deskripsi_kendala: 'AC bocor' })
        );
        expect(mockNotificationService.sendBulkNotification).toHaveBeenCalledWith(
            expect.objectContaining({ penerima_ids: ['ob-1', 'ob-2'], pengirim_id: userId })
        );
    });
});

describe('KaryawanService.getRiwayat', () => {
    it('mengembalikan riwayat laporan yang sudah di-mapping', async () => {
        mockLaporanService.getReportsByUserId.mockResolvedValue({
            items: [
                {
                    id: 'laporan-1',
                    kategori: { nama_kategori: 'AC' },
                    deskripsi_kendala: 'AC bocor',
                    status: 'SELESAI',
                    prioritas: 'STANDARD',
                    foto_masalah: [],
                    lantai: { lokasi: { nama_lokasi: 'Gedung' }, nomor_lantai: 1 },
                    ob: null,
                    created_at: new Date('2026-01-01T00:00:00Z'),
                    updated_at: new Date('2026-01-01T00:00:00Z'),
                },
            ],
            next_cursor: null,
            meta: { total_items: 1, current_page: 1, limit: 10, total_pages: 1 },
        } as never);

        const data = await mockKaryawanService.getRiwayat(userId, 10, {});

        expect(mockLaporanService.getReportsByUserId).toHaveBeenCalledWith(userId, 10, undefined, undefined, undefined);
        expect(data.items).toHaveLength(1);
        expect(data.items[0]?.kategori).toBe('AC');
    });
});
