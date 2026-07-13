import type { AdminLaporanPageResponse, AdminLaporanQuery, AdminReportDetailResponse, PatchLaporanReq, UserSearchQuery, UserStatsRes } from '../dto/admin.js';
import type { GetDashboardQuery, DashboardMainResponse } from '../dto/admin.js';

export interface IAdminService {
    getUserStats(): Promise<UserStatsRes>;
    getDashboardData(query: GetDashboardQuery): Promise<DashboardMainResponse>;
    getAllLaporan(page: number, limit: number, query: AdminLaporanQuery): Promise<AdminLaporanPageResponse>;
    getReportDetail(id: string): Promise<AdminReportDetailResponse>;
    patchLaporan(laporanId: string, dto: PatchLaporanReq): Promise<void>;
}

