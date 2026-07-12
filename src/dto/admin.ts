import { z } from 'zod';
import { LAPORAN_PRIORITY, LAPORAN_STATUS, type LaporanPriority, type LaporanStatus } from '../utils/constants.js';
import { Prisma } from "../generated/prisma/client.js";

export const GetDashboardQuerySchema = z.object({
    range: z.enum(['mingguan', 'bulanan', 'tahunan']).default('mingguan'),
});
export type GetDashboardQuery = z.infer<typeof GetDashboardQuerySchema>;

const emptyToNull = (val: unknown) => (val === "" || val === undefined ? null : val);

export const AdminLaporanQuerySchema = z.object({
    search: z.preprocess(emptyToNull, z.string().nullable()),
    status: z.preprocess(emptyToNull, z.enum(Object.values(LAPORAN_STATUS) as [string, ...string[]]).nullable()),
    prioritas: z.preprocess(emptyToNull, z.enum(Object.values(LAPORAN_PRIORITY) as [string, ...string[]]).nullable()),
    lokasi_id: z.preprocess(emptyToNull, z.string().uuid({ message: "Format lokasi_id harus UUID yang valid" }).nullable()),
    lantai_id: z.preprocess(emptyToNull, z.string().uuid({ message: "Format lantai_id harus UUID yang valid" }).nullable()),
    start_date: z.preprocess(emptyToNull, z.coerce.date().nullable()),
    end_date: z.preprocess(emptyToNull, z.coerce.date().nullable()),
    sort_by: z.enum(["created_at", "updated_at", "prioritas", "status", "nama_karyawan", "lokasi"]).default("created_at"),
    sort_order: z.enum(["asc", "desc"]).default("desc"),
});

export type AdminLaporanQuery = z.infer<typeof AdminLaporanQuerySchema>;

export interface StatDetail {
    count: number;
    trend_value: number;
    is_positive: boolean;
}

export interface KpiResponse {
    total_laporan: StatDetail;
    laporan_selesai: StatDetail;
    laporan_berjalan: StatDetail;
    laporan_ditolak: StatDetail;
}

export interface BarChartResponse {
    label: string;
    count: number;
}

export interface PieChartResponse {
    status: LaporanStatus;
    label: string;
    percentage: number;
    count: number;
}

export interface RecentLaporanResponse {
    id_laporan: string;
    nama_karyawan: string;
    lokasi: string;
    prioritas:LaporanPriority;
    status: LaporanStatus;
}

export interface DailyChecklistObResponse {
    nama_ob: string;
    total_tugas: number;
    tugas_selesai: number;
    persentase: number;
}

export interface DashboardMainResponse {
    kpi: KpiResponse;
    bar_chart: BarChartResponse[];
    pie_chart: PieChartResponse[];
    recent_laporan: RecentLaporanResponse[];
    daily_checklist_ob: DailyChecklistObResponse[];
}

export interface UserStatsRes {
    totalUsers: number;
    activeUsers: number;
    nonActiveUsers: number;
    totalOB: number;
}
export type AdminReportDetailResponse = {
    id: string;
    status: LaporanStatus;
    nama_karyawan: string;
    lokasi: string;
    kategori: string;
    ob_ditugaskan: string | null;
    waktu_laporan: Date;
    waktu_selesai: Date | null;
    deskripsi_kendala: string;
    bukti_foto: {
        urls: string[];
        diupload_oleh: string | null;
        jam_upload: string | null;   
    };
};

export interface AdminLaporanItemResponse {
    id: string;
    id_laporan: string;
    nama_karyawan: string;
    lokasi: string;
    lokasi_id: string | null;
    lantai_id: string;
    nomor_lantai: number;
    kategori: string;
    prioritas: LaporanPriority;
    status: LaporanStatus;
    nama_ob: string | null;
    created_at: string;
    updated_at: string;
}

export interface LokasiTerpopulerResponse {
    lokasi_id: string | null;
    nama_lokasi: string;
    total_laporan: number;
}

export interface LaporanAktifResponse {
    total_laporan: number;
}

export interface AdminLaporanPageResponse {
    laporan: {
        items: AdminLaporanItemResponse[];
        next_cursor: null;
        meta: {
            total_items: number;
            current_page: number;
            limit: number;
            total_pages: number;
        };
    };
    lokasi_terpopuler: LokasiTerpopulerResponse[];
    laporan_aktif: LaporanAktifResponse;
    recent_laporan: RecentLaporanResponse[];
}

export interface DailyChecklistObPayload {
    ob_id: string;
    nama_ob: string;
    total_tugas: number;
    tugas_selesai: number;
}


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
    prioritas: string;
    created_at: Date;
}
export const UserSearchQuerySchema = z.object({
    search: z.preprocess(emptyToNull, z.string().nullable()),
    role_id: z.preprocess(emptyToNull, z.string().uuid({ message: "Format role_id harus UUID yang valid" }).nullable()),
});

export type UserSearchQuery = z.infer<typeof UserSearchQuerySchema>;
