import { z } from 'zod';
import { LAPORAN_PRIORITY, LAPORAN_STATUS, type LaporanPriority, type LaporanStatus } from '../utils/constants.js';
import { Prisma } from "../generated/prisma/client.js";
import type { PaginatedResponse } from './response.js';

export const GetDashboardQuerySchema = z.object({
    period: z.enum(['harian', 'mingguan', 'bulanan', 'tahunan']).default('mingguan'),
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

export const AdminLaporanHistoryQuerySchema = z.object({
    search: z.preprocess(emptyToNull, z.string().nullable()),
    user_id: z.preprocess(emptyToNull, z.string().uuid({ message: "Format user_id harus UUID yang valid" })),
});

export type AdminLaporanQuery = z.infer<typeof AdminLaporanQuerySchema>;
export type AdminLaporanHistoryQuery = z.infer<typeof AdminLaporanHistoryQuerySchema>;

export interface StatDetail {
    count: number;
    trend_value: number;
    is_positive: boolean;
}

export interface KpiResponse {
    total_laporan: StatDetail;
    laporan_selesai: StatDetail;
    laporan_berjalan: StatDetail;
    laporan_dibatalkan: StatDetail;
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
    prioritas: LaporanPriority;
    status: LaporanStatus;
    created_at: Date;
}

export interface RecentActivityResponse {
    id: string;
    title: string;
    location: string;
    status: LaporanStatus;
    assignee_name: string | null;
    timestamp: Date;
}


export interface DailyChecklistOBResponse {
    nama_ob: string;
    total_tugas: number;
    tugas_selesai: number;
    persentase: number;
}

export interface DashboardMainResponse {
    kpi: KpiResponse;
    bar_chart: BarChartResponse[];
    pie_chart: PieChartResponse[];
    recent_activities: RecentActivityResponse[];
    daily_checklist_ob: DailyChecklistOBResponse[];
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
    prioritas: LaporanPriority;
    nama_karyawan: string;
    lokasi: string;
    kategori: string;
    ob_ditugaskan: string | null;
    waktu_laporan: Date;
    waktu_selesai: Date | null;
    dikerjakan_at: Date | null;
    selesai_at: Date | null;
    dibatalkan_at: Date | null;
    admin_catatan: string | null;
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

export interface RuanganTerpopulerResponse {
    ruangan_id: string | null;
    nama_ruangan: string;
    nama_lantai: string;
    nama_lokasi: string;
    total_laporan: number;
}

export interface LaporanAktifResponse {
    total_laporan: number;
}

export interface AdminLaporanPageResponse {
    laporan: PaginatedResponse<AdminLaporanItemResponse>;
    ruangan_terpopuler: RuanganTerpopulerResponse[];
    laporan_aktif: LaporanAktifResponse;
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
    created_at: Date;
}

export interface AssignObRepoArgs{
    obId: string;
    lokasiId: string;
}


export const UserSearchQuerySchema = z.object({
    search: z.preprocess(emptyToNull, z.string().nullable()),
    role_id: z.preprocess(emptyToNull, z.string().uuid({ message: "Format role_id harus UUID yang valid" }).nullable()),
});

export type UserSearchQuery = z.infer<typeof UserSearchQuerySchema>;

export const PatchLaporanReqSchema = z.object({
    status: z.preprocess(
        emptyToNull,
        z.enum(Object.values(LAPORAN_STATUS) as [string, ...string[]]).nullable().optional()
    ),
    prioritas: z.preprocess(
        emptyToNull,
        z.enum(Object.values(LAPORAN_PRIORITY) as [string, ...string[]]).nullable().optional()
    ),
    ob_id: z.preprocess(
        emptyToNull,
        z.string().uuid({ message: "Format ob_id harus UUID yang valid" }).nullable().optional()
    ),
    admin_catatan: z.preprocess(
        emptyToNull,
        z.string().max(1000).nullable().optional()
    ),
    lantai_id: z.preprocess(
        emptyToNull,
        z.string().uuid({ message: "Format lantai_id harus UUID yang valid" }).optional()
    ),
    ruangan_id: z.preprocess(
        emptyToNull,
        z.string().uuid({ message: "Format ruangan_id harus UUID yang valid" }).optional()
    ),
}).refine(data => Object.values(data).some(v => v !== undefined && v !== null), {
    message: "Setidaknya satu field harus diisi"
});

export type PatchLaporanReq = z.infer<typeof PatchLaporanReqSchema>;
export const AssignObToLocationsSchema = z.object({
    obId: z.string().uuid({ message: "Format obId harus UUID yang valid" }),
    lokasiIds: z.array(z.string().uuid({ message: "Format lokasiId harus UUID yang valid" })),
    bulan: z.number().int().min(1).max(12),
    tahun: z.number().int().min(2000).max(2100),
});

export type AssignObToLocationsReq = z.infer<typeof AssignObToLocationsSchema>;

export const StatsTugasQuerySchema = z.object({
    period: z.enum(['harian', 'mingguan', 'bulanan', 'tahunan']).default('harian'),
    lokasi_id: z.string().uuid().optional(),
});
export type StatsTugasQuery = z.infer<typeof StatsTugasQuerySchema>;

export interface StatsTugasResponse {
    total: number;
    diproses_ob: number;
    menunggu_persetujuan: number;
}

export const StatsLaporanQuerySchema = z.object({
    period: z.enum(['harian', 'mingguan', 'bulanan', 'tahunan']).default('harian'),
    lokasi_id: z.string().uuid().optional(),
});
export type StatsLaporanQuery = z.infer<typeof StatsLaporanQuerySchema>;

export interface StatsLaporanResponse {
    laporan_baru: number;
    sedang_dikerjakan: number;
    selesai_hari_ini: number;
}

export interface ApprovalItemResponse {
    id: string;
    nama_tugas: string;
    nama_ob: string | null;
    lokasi: string | null;
    kategori: string | null;
    selesai_at: Date | null;
}