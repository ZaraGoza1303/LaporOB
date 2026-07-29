import type { AdminLaporanHistoryQuery, AdminLaporanQuery, PatchLaporanReq, UserSearchQuery, StatsTugasQuery, StatsLaporanQuery, ObPerformanceDashboardQuery } from '../dto/admin.js';
import type { GetDashboardQuery } from '../dto/admin.js';
import type { AdminLaporanPageResponse, AdminReportDetailResponse, UserStatsRes, StatsTugasResponse, StatsLaporanResponse, AdminProfileData, ObRankingItem, ObPerformanceDashboardResponse, DashboardMainResponse } from '../types/admin.js';
import type { PenugasanObWithDetails } from '../repositories/admin_repository.interface.js';
import type { Laporan_karyawan } from '../generated/prisma/client.js';
import type { PaginatedResponse } from '../types/response.js';

export interface IAdminService {
    getUserStats(): Promise<UserStatsRes>;
    getDashboardData(query: GetDashboardQuery, page_laporan: number, limit_laporan: number, page_tugas: number, limit_tugas: number): Promise<DashboardMainResponse>;
    getAllLaporan(page: number, limit: number, query: AdminLaporanQuery): Promise<AdminLaporanPageResponse>;
    getAllHistoryLaporan(page: number, limit: number, query: AdminLaporanHistoryQuery): Promise<PaginatedResponse<Laporan_karyawan>>;
    getReportDetail(id: string): Promise<AdminReportDetailResponse>;
    patchLaporan(laporanId: string, dto: PatchLaporanReq): Promise<void>;
    assignObToLocations(obId: string, lokasiIds: string[], bulan: number, tahun: number): Promise<void>;
    getPenugasanByPeriode(bulan: number, tahun: number): Promise<PenugasanObWithDetails[]>;
    approveLaporan(laporanId: string, catatan?: string): Promise<Laporan_karyawan>;
    rejectLaporan(laporanId: string, catatan: string): Promise<Laporan_karyawan>;
    deleteLaporan(laporanId: string): Promise<void>;
    getStatsTugas(query: StatsTugasQuery): Promise<StatsTugasResponse>;
    getStatsLaporan(query: StatsLaporanQuery): Promise<StatsLaporanResponse>;
    getAdminStats(userId: string): Promise<AdminProfileData>;
    getObRanking(): Promise<ObRankingItem[]>;
    getObPerformanceDashboard(query: ObPerformanceDashboardQuery): Promise<ObPerformanceDashboardResponse>;
}

