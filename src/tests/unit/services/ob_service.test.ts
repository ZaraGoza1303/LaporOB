import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";
import { PrismaClient } from "../../../generated/prisma/client";
import { ObRepository } from "../../../repositories/ob_repository";
import { ObService } from "../../../services/ob_service";
import type { ILaporanService } from "../../../services/laporan_service.interface";
import type { IUsersService } from "../../../services/users_service.interface";
import { AppError } from "../../../utils/error";

const mockDB = mockDeep<PrismaClient>();
const mockLaporanService = mockDeep<ILaporanService>();
const mockUsersService = mockDeep<IUsersService>();

const mockObRepo = new ObRepository(mockDB);
const mockObService = new ObService(mockObRepo, mockLaporanService, mockUsersService);

beforeEach(() => {
    mockReset(mockDB);
    mockReset(mockLaporanService);
    mockReset(mockUsersService);
    vi.restoreAllMocks();
});

const obId = 'e2fbdc6f-ec0d-4547-a51d-a81b69741ed2';

describe('ObService.getHomeStats', () => {
    it('mengembalikan home ob beserta laporan urgent', async () => {
        mockDB.user.findFirst.mockResolvedValue({
            id: obId,
            nama_lengkap: 'Farhan OB',
        } as never);
        mockLaporanService.getReportsForObDashboard.mockResolvedValue([
            {
                id: 'laporan-1',
                kategori: { nama_kategori: 'AC' },
                deskripsi_kendala: 'AC bocor',
                status: 'BELUM_DIKERJAKAN',
                foto_masalah: [],
                lantai: { lokasi: { nama_lokasi: 'Gedung' }, nomor_lantai: 1 },
                prioritas: 'URGENT',
                is_kolaborasi_open: false,
                created_at: new Date('2026-01-01T00:00:00Z'),
            },
        ] as never);

        const data = await mockObService.getHomeStats(obId);

        expect(data.ob.nama_lengkap).toBe('Farhan OB');
        expect(data.laporan).toHaveLength(1);
    });

    it('melempar AppError 404 jika ob tidak ditemukan', async () => {
        mockDB.user.findFirst.mockResolvedValue(null);

        await expect(mockObService.getHomeStats(obId)).rejects.toThrow(
            new AppError('OB user tidak ditemukan', 404)
        );
    });
});

describe('ObService.getProfile', () => {
    it('mengembalikan profil ob beserta lokasi aktif', async () => {
        mockUsersService.getByID.mockResolvedValue({
            id: obId,
            nama_lengkap: 'Farhan OB',
            username: 'farhan_ob',
            email: 'farhan_ob@gmail.com',
            profile_picture: null,
            role: { nama_role: 'OB' },
        } as never);
        mockLaporanService.getObPerformanceStats.mockResolvedValue({
            total_tugas_selesai: 10,
        } as never);
        mockDB.penugasanOb.findMany.mockResolvedValue([
            {
                id: 'penugasan-1',
                lokasi: { id: 'lokasi-1', nama_lokasi: 'Gedung WGS' },
            },
        ] as never);
        mockLaporanService.getReportsByObId.mockResolvedValue({
            items: [],
            next_cursor: null,
            meta: { total_items: 3, current_page: 1, limit: 1, total_pages: 3 },
        } as never);

        const data = await mockObService.getProfile(obId);

        expect(data.nama_lengkap).toBe('Farhan OB');
        expect(data.laporanSelesai).toBe(10);
        expect(data.lokasiAktif).toHaveLength(1);
    });

    it('melempar AppError 404 jika user tidak ditemukan', async () => {
        mockUsersService.getByID.mockResolvedValue(null);

        await expect(mockObService.getProfile(obId)).rejects.toThrow(
            new AppError('OB tidak ditemukan', 404)
        );
    });
});

describe('ObService.getActiveAssignments', () => {
    it('mengembalikan penugasan aktif', async () => {
        const fakeAssignments = [{ id: 'penugasan-1' }];
        mockDB.penugasanOb.findMany.mockResolvedValue(fakeAssignments as never);

        const data = await mockObService.getActiveAssignments(obId, 1, 2026);

        expect(mockDB.penugasanOb.findMany).toHaveBeenCalledWith({
            where: { ob_id: obId, bulan: 1, tahun: 2026 },
            include: { lokasi: true },
        });
        expect(data).toEqual(fakeAssignments);
    });
});
