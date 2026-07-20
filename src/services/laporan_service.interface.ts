import type { MappedReportDetailRes, MappedProfileReport } from '../dto/users.js';
import type { PaginatedResponse } from '../dto/response.js';
import type { AdminLaporanHistoryQuery, AdminLaporanQuery, PatchLaporanReq } from '../dto/admin.js';
import type { RecentActivityPayload, ReportSummaryPayload, AdminLaporanPayload, RuanganTerpopulerPayload, DetailReportPayload, ProfileReport, LaporanKaryawanWithDetails } from '../repositories/laporan_repository.interface.js';
import type { UserActivityRes } from '../dto/users.js';
import type { Laporan_karyawanCreateInput } from '../generated/prisma/models.js';
import type { Laporan_karyawan } from "../generated/prisma/client.js";
import type { PeriodRange } from "../utils/date.js";

export interface ILaporanService {
    getReportDetail(reportId: string): Promise<MappedReportDetailRes>;
    getReportDetailWithRelations(reportId: string): Promise<DetailReportPayload | null>;
    getRiwayat(obId: string, limit: number, cursor?: string | null, search?: string | null, status?: string | null): Promise<PaginatedResponse<MappedProfileReport>>;
    getRecentActivities(limit: number): Promise<RecentActivityPayload[]>;
    getReportsByDateRange(startDate: Date, endDate: Date): Promise<ReportSummaryPayload[]>;
    getAllLaporan(page: number, limit: number, query: AdminLaporanQuery): Promise<PaginatedResponse<AdminLaporanPayload>>;
    getAllHistoryLaporan(page: number, limit: number, query: AdminLaporanHistoryQuery): Promise<PaginatedResponse<Laporan_karyawan>>;
    getRuanganTerpopuler(limit: number, query: AdminLaporanQuery): Promise<RuanganTerpopulerPayload[]>;
    countLaporanAktif(query: AdminLaporanQuery): Promise<number>;
    getActivity(userId: string): Promise<UserActivityRes[]>;
    insertReport(req: Laporan_karyawanCreateInput): Promise<string>;
    getReportsByUserId(userId: string, limit: number, cursor?: string | null, search?: string | null, status?: string | null): Promise<PaginatedResponse<ProfileReport>>;
    getReportsByObId(obId: string, limit: number, cursor?: string | null, search?: string | null, status?: string | null): Promise<PaginatedResponse<ProfileReport>>;
    patchLaporan(laporanId: string, dto: PatchLaporanReq): Promise<void>;
    toggleKolaborasiOpen(laporanId: string, obId: string, isOpen: boolean, catatan?: string): Promise<void>;
    getLaporanCountByUserId(userId: string): Promise<number>;
    deleteLaporan(laporanId: string): Promise<void>;
    getReportsForObDashboard(obId: string): Promise<LaporanKaryawanWithDetails[]>;
    ambilLaporan(laporanId: string, obId: string): Promise<void>;
    createHistoriPekerjaan(laporanId: string, fotoUrls: string[], catatan: string, obId: string): Promise<void>;
    batalkanLaporan(laporanId: string, fotoUrls: string[], catatan: string, obId: string): Promise<void>;
    approveLaporan(laporanId: string, catatan?: string): Promise<Laporan_karyawan>;
    rejectLaporan(laporanId: string, catatan: string): Promise<Laporan_karyawan>;
    getObPerformanceStats(obId: string, dateRange?: PeriodRange): Promise<{ laporanDiterima: number; laporanSelesai: number }>;
}
