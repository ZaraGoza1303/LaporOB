import type { PaginatedResponse } from "../types/response.js";
import type { UserActivityRes, PublicUser } from "../types/users.js";
import type { AdminLaporanHistoryQuery, AdminLaporanQuery } from '../dto/admin.js';
import type { Kategori, Lantai, Lokasi, Laporan_karyawan, Prisma } from "../generated/prisma/client.js";
import type { Laporan_karyawanCreateInput } from "../generated/prisma/models.js";
import type { PeriodRange } from "../utils/date.js";
import type { ObPerformance } from "../types/ob.js";

export type ProfileReport = Laporan_karyawan & {
    kategori: Kategori;
    lantai: Lantai & {
        lokasi: Lokasi;
    };
    ob: PublicUser | null;
};

export type DetailReportPayload = Prisma.Laporan_karyawanGetPayload<{
    include: {
        kategori: true;
        lantai: { include: { lokasi: true } };
        ob: { omit: { password: true } };
        pelapor: { omit: { password: true } };
        histori_pekerjaan: true;
        kolaborasi: {
            include: {
                ob: {
                    select: { id: true; nama_lengkap: true };
                };
            };
        };
    };
}>;

export type RecentActivityPayload = Prisma.Laporan_karyawanGetPayload<{
    include: {
        lantai: { include: { lokasi: true } };
        ob: { omit: { password: true } };
    };
}>;

export interface ReportSummaryPayload {
    id: string;
    status: string;
    created_at: Date;
}

export type AdminLaporanPayload = Prisma.Laporan_karyawanGetPayload<{
    include: {
        pelapor: { omit: { password: true } };
        ob: { omit: { password: true } };
        lantai: { include: { lokasi: true } };
        kategori: true;
    };
}>;

export interface StatusInfoPayload {
    mendesak: number;
    standar: number;
    dibatalkan: number;
    menunggu: number;
    sedang_dikerjakan: number;
    selesai: number;
}

export type LaporanKaryawanWithDetails = Prisma.Laporan_karyawanGetPayload<{
    include: {
        kategori: true;
        lantai: {
            include: {
                lokasi: true;
            };
        };
    };
}>;

export interface ILaporanRepository {
    getActivity(userId: string): Promise<UserActivityRes[]>;
    insertReport(req: Laporan_karyawanCreateInput): Promise<string>;
    patchLaporan(laporanId: string, data: Prisma.Laporan_karyawanUncheckedUpdateInput): Promise<void>;
    updateKolaborasiOpen(laporanId: string, isOpen: boolean, catatan?: string): Promise<void>;
    getReportsByUserId(userId: string, limit: number, cursor?: string | null, search?: string | null, status?: string | null): Promise<PaginatedResponse<ProfileReport>>;
    getReportsByObId(obId: string, limit: number, cursor?: string | null, search?: string | null, status?: string | null): Promise<PaginatedResponse<ProfileReport>>;
    getReportDetailById(reportId: string): Promise<DetailReportPayload | null>;
    getRecentActivities(page: number, limit: number): Promise<PaginatedResponse<RecentActivityPayload>>;
    getReportsByDateRange(startDate: Date, endDate: Date): Promise<ReportSummaryPayload[]>;
    getAllLaporan(page: number, limit: number, query: AdminLaporanQuery): Promise<PaginatedResponse<AdminLaporanPayload>>;
    getAllHistoryLaporan(page: number, limit: number, query: AdminLaporanHistoryQuery): Promise<PaginatedResponse<Laporan_karyawan>>;
    getStatusInfo(query: AdminLaporanQuery): Promise<StatusInfoPayload>;
    countLaporanAktif(query: AdminLaporanQuery): Promise<number>;
    getLaporanCountByUserId(userId: string): Promise<number>;
    deleteLaporan(laporanId: string): Promise<void>;
    getReportsForObDashboard(obId: string): Promise<LaporanKaryawanWithDetails[]>;
    ambilLaporan(laporanId: string, obId: string): Promise<void>;
    createHistoriSelesai(laporanId: string, obId: string, fotoSelesai: string[], catatan: string): Promise<void>;
    batalkanLaporan(laporanId: string, obId: string, fotoSelesai: string[], catatan: string): Promise<void>;
    approveLaporan(laporanId: string, catatan?: string): Promise<Laporan_karyawan>;
    rejectLaporan(laporanId: string, catatan: string): Promise<Laporan_karyawan>;
    getObPerformanceStats(obId: string): Promise<ObPerformance>;
    calculateAverageObTime(obId: string): Promise<number>;
    getTotalDurasiObInSeconds(obId: string): Promise<number>;
}

