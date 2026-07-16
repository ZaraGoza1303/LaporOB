import type { AdminLaporanPageResponse, AdminLaporanQuery, AdminReportDetailResponse, PatchLaporanReq, UserSearchQuery, UserStatsRes } from '../dto/admin.js';
import type { GetDashboardQuery, DashboardMainResponse } from '../dto/admin.js';
import type { PenugasanObWithDetails } from '../repositories/admin_repository.interface.js';
import type { Laporan_karyawan } from '../generated/prisma/client.js';

export interface IAdminService {
    getUserStats(): Promise<UserStatsRes>;
    getDashboardData(query: GetDashboardQuery): Promise<DashboardMainResponse>;
    getAllLaporan(page: number, limit: number, query: AdminLaporanQuery): Promise<AdminLaporanPageResponse>;
    getReportDetail(id: string): Promise<AdminReportDetailResponse>;
    patchLaporan(laporanId: string, dto: PatchLaporanReq): Promise<void>;
    assignObToLocations(obId: string, lokasiIds: string[], bulan: number, tahun: number): Promise<void>;
    getPenugasanByPeriode(bulan: number, tahun: number): Promise<PenugasanObWithDetails[]>;
    approveLaporan(laporanId: string, catatan?: string): Promise<Laporan_karyawan>;
    rejectLaporan(laporanId: string, catatan: string): Promise<Laporan_karyawan>;
    deleteLaporan(laporanId: string): Promise<void>;
}

