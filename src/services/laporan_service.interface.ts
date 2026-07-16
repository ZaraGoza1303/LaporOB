import type { MappedReportDetailRes } from '../dto/users.js';
import type { PaginatedResponse } from '../dto/response.js';
import type { AdminLaporanQuery, PatchLaporanReq } from '../dto/admin.js';
import type { RecentActivityPayload, ReportSummaryPayload, AdminLaporanPayload, RuanganTerpopulerPayload, DetailReportPayload, ProfileReport } from '../repositories/laporan_repository.interface.js';
import type { UserActivityRes } from '../dto/users.js';
import type { Laporan_karyawanCreateInput } from '../generated/prisma/models.js';

export interface ILaporanService {
    getReportDetail(reportId: string, userId: string, role: string): Promise<MappedReportDetailRes>;
    getReportDetailById(reportId: string): Promise<DetailReportPayload | null>;
    getRecentActivities(limit: number): Promise<RecentActivityPayload[]>;
    getReportsByDateRange(startDate: Date, endDate: Date): Promise<ReportSummaryPayload[]>;
    getAllLaporan(page: number, limit: number, query: AdminLaporanQuery): Promise<PaginatedResponse<AdminLaporanPayload>>;
    getRuanganTerpopuler(limit: number, query: AdminLaporanQuery): Promise<RuanganTerpopulerPayload[]>;
    countLaporanAktif(query: AdminLaporanQuery): Promise<number>;
    getActivity(userId: string): Promise<UserActivityRes[]>;
    insertReport(req: Laporan_karyawanCreateInput): Promise<void>;
    getReportsByUserId(userId: string, limit: number, cursor?: string | null, search?: string | null, status?: string | null): Promise<PaginatedResponse<ProfileReport>>;
    getReportsByObId(obId: string, limit: number, cursor?: string | null, search?: string | null, status?: string | null): Promise<PaginatedResponse<ProfileReport>>;
    patchLaporan(laporanId: string, dto: PatchLaporanReq): Promise<void>;
    toggleKolaborasiOpen(laporanId: string, isOpen: boolean): Promise<void>;
    getLaporanCountByUserId(userId: string): Promise<number>;
    deleteLaporan(laporanId: string): Promise<void>;
}
