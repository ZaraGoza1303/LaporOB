import type { PaginatedResponse } from "../dto/response.js";
import type { UserActivityRes } from "../dto/users.js";
import type { AdminLaporanHistoryQuery, AdminLaporanQuery } from '../dto/admin.js';
import type { User, Kategori, Lantai, Lokasi, Laporan_karyawan, Prisma } from "../generated/prisma/client.js";
import type { Laporan_karyawanCreateInput } from "../generated/prisma/models.js";
import type { PeriodRange } from "../utils/date.js";
import type { ObPerformance } from "../dto/ob.js";

export type ProfileReport = Laporan_karyawan & {
    kategori: Kategori;
    lantai: Lantai & {
        lokasi: Lokasi;
    };
    ob: User | null;
};

export type DetailReportPayload = Prisma.Laporan_karyawanGetPayload<{
    include: {
        kategori: true;
        lantai: { include: { lokasi: true } };
        ob: true;
        pelapor: true;
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
        ob: true;
    };
}>;

export interface ReportSummaryPayload {
    id: string;
    status: string;
    created_at: Date;
}

export type AdminLaporanPayload = Prisma.Laporan_karyawanGetPayload<{
    include: {
        pelapor: true;
        ob: true;
        lantai: { include: { lokasi: true } };
        kategori: true;
    };
}>;

export interface RuanganTerpopulerPayload {
    ruangan_id: string | null;
    nama_ruangan: string;
    nama_lantai: string;
    nama_lokasi: string;
    total_laporan: number;
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
    getRecentActivities(limit: number): Promise<RecentActivityPayload[]>;
    getReportsByDateRange(startDate: Date, endDate: Date): Promise<ReportSummaryPayload[]>;
    getAllLaporan(page: number, limit: number, query: AdminLaporanQuery): Promise<PaginatedResponse<AdminLaporanPayload>>;
    getAllHistoryLaporan(page: number, limit: number, query: AdminLaporanHistoryQuery): Promise<PaginatedResponse<Laporan_karyawan>>;
    getRuanganTerpopuler(limit: number, query: AdminLaporanQuery): Promise<any[]>;
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

