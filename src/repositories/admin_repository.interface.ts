import type { Prisma } from "../generated/prisma/client.js";
import type { AdminLaporanQuery, UserStatsRes } from "../dto/admin.js";
import type { PaginatedResponse } from "../dto/response.js";

export type RecentActivityPayload = Prisma.Laporan_karyawanGetPayload<{
    include: {
        lantai: {
            include: { lokasi: true }
        };
        ob: true;
    };
}>;

export interface ReportSummaryPayload {
    id: string;
    status: string;
    created_at: Date;
}

export type LaporanDetailPayload = Prisma.Laporan_karyawanGetPayload<{
    include: {
        pelapor: true;
        ob: true;
        lantai: { include: { lokasi: true } };
        kategori: true;
        histori_pekerjaan: true;
    };
}>;

export type AdminLaporanPayload = Prisma.Laporan_karyawanGetPayload<{
    include: {
        pelapor: true;
        ob: true;
        lantai: { include: { lokasi: true } };
        kategori: true;
    };
}>;

export interface LokasiTerpopulerPayload {
    lokasi_id: string | null;
    nama_lokasi: string;
    total_laporan: number;
}

export interface IAdminRepository {
    getUserStats(): Promise<UserStatsRes>;
    getRecentActivities(limit: number): Promise<RecentActivityPayload[]>;
    getReportsByDateRange(startDate: Date, endDate: Date): Promise<ReportSummaryPayload[]>;
    getReportDetailById(laporanId: string): Promise<LaporanDetailPayload | null>;
    getAllLaporan(page: number, limit: number, query: AdminLaporanQuery): Promise<PaginatedResponse<AdminLaporanPayload>>;
    getLokasiTerpopuler(limit: number, query: AdminLaporanQuery): Promise<LokasiTerpopulerPayload[]>;
    countLaporanAktif(query: AdminLaporanQuery): Promise<number>;
    getDailyChecklistOB(tanggal: Date): Promise<any[]>;
}
