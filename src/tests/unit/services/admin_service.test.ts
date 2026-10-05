import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";
import { PrismaClient } from "../../../generated/prisma/client";
import { AdminRepository } from "../../../repositories/admin_repository";
import { AdminService } from "../../../services/admin_service";
import type { ILaporanService } from "../../../services/laporan_service.interface";
import type { IUsersService } from "../../../services/users_service.interface";
import type { IRedisClient } from "../../../database/redis.interface";
import { AppError } from "../../../utils/error";

const mockDB = mockDeep<PrismaClient>();
const mockLaporanService = mockDeep<ILaporanService>();
const mockUsersService = mockDeep<IUsersService>();
const mockRedis = mockDeep<IRedisClient>();

const mockAdminRepo = new AdminRepository(mockDB);
const mockAdminService = new AdminService(mockAdminRepo, mockLaporanService, mockUsersService, mockRedis);

beforeEach(() => {
    mockReset(mockDB);
    mockReset(mockLaporanService);
    mockReset(mockUsersService);
    mockReset(mockRedis);
    vi.restoreAllMocks();
});

const laporanId = '3f2a1b7c-9d4e-4a51-8c6f-1d2e3f4a5b6c';

describe('AdminService.getUserStats', () => {
    it('mengembalikan statistik user dari repository', async () => {
        const fakeStats = { totalUsers: 10, activeUsers: 7, nonActiveUsers: 3, totalOB: 5 };
        mockDB.user.count.mockResolvedValue(1);
        mockDB.role.findFirst.mockResolvedValue({ id: 'role-ob' } as never);

        const data = await mockAdminService.getUserStats();

        expect(data).toEqual(expect.objectContaining({ totalUsers: expect.any(Number) }));
    });
});

describe('AdminService.getAllLaporan', () => {
    it('menggabungkan laporan, status, dan total aktif dengan nomor urut', async () => {
        const query = { search: null } as never;
        mockLaporanService.getAllLaporan.mockResolvedValue({
            items: [
                {
                    id: laporanId,
                    pelapor: { nama_lengkap: 'Karyawan A' },
                    lantai: { lokasi: { id: 'lokasi-1', nama_lokasi: 'Gedung' }, nomor_lantai: 2 },
                    lantai_id: 'lantai-1',
                    kategori: { nama_kategori: 'AC' },
                    prioritas: 'STANDARD',
                    status: 'BELUM_DIKERJAKAN',
                    ob: null,
                    created_at: new Date('2026-01-01T00:00:00Z'),
                    updated_at: new Date('2026-01-01T00:00:00Z'),
                },
            ],
            next_cursor: null,
            meta: { total_items: 1, current_page: 1, limit: 10, total_pages: 1 },
        } as never);
        mockLaporanService.getStatusInfo.mockResolvedValue({ menunggu: 1 } as never);
        mockLaporanService.countLaporanAktif.mockResolvedValue(1);

        const data = await mockAdminService.getAllLaporan(1, 10, query);

        expect(data.laporan.items[0]?.id_laporan).toBe('LPR - 001');
        expect(data.laporan.items[0]?.lokasi).toContain('Gedung');
        expect(data.laporan_aktif.total_laporan).toBe(1);
    });
});

describe('AdminService.getReportDetail', () => {
    it('melempar AppError 404 jika laporan tidak ditemukan', async () => {
        mockLaporanService.getReportDetailWithRelations.mockResolvedValue(null);

        await expect(mockAdminService.getReportDetail(laporanId)).rejects.toThrow(
            new AppError('Laporan tidak ditemukan', 404)
        );
    });
});

describe('AdminService.patchLaporan', () => {
    it('melempar AppError 404 jika laporan tidak ditemukan', async () => {
        mockLaporanService.getReportDetailWithRelations.mockResolvedValue(null);

        await expect(
            mockAdminService.patchLaporan(laporanId, {} as never)
        ).rejects.toThrow(new AppError('Laporan tidak ditemukan', 404));
    });
});

describe('AdminService.approveLaporan', () => {
    it('menyetujui laporan dan mengembalikan hasilnya', async () => {
        const fakeDetail = { id: laporanId } as never;
        const fakeApproved = { id: laporanId, status: 'SELESAI' } as never;
        mockLaporanService.getReportDetail.mockResolvedValue(fakeDetail);
        mockLaporanService.approveLaporan.mockResolvedValue(fakeApproved);

        const data = await mockAdminService.approveLaporan(laporanId, 'bagus');

        expect(mockLaporanService.approveLaporan).toHaveBeenCalledWith(laporanId, 'bagus');
        expect(data).toEqual(fakeApproved);
    });
});

describe('AdminService.getAdminStats', () => {
    it('menggabungkan approved tugas, review laporan, dan hari aktif', async () => {
        mockDB.checklist_harian.count.mockResolvedValue(2);
        mockDB.tugas.count.mockResolvedValue(3);
        mockDB.laporan_karyawan.count.mockResolvedValue(4);
        mockDB.$queryRaw.mockResolvedValue([{ count: BigInt(5) }] as never);

        const data = await mockAdminService.getAdminStats('admin-1');

        expect(data).toEqual({
            total_tugas_approved: 5,
            laporan_direview: 4,
            hari_aktif: 5,
        });
    });
});
