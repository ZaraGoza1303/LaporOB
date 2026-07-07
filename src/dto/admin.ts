import { z } from 'zod';
import { type LaporanStatus } from '../utils/constants.js';
import { Prisma } from "../generated/prisma/client.js";

export const GetDashboardQuerySchema = z.object({
    period: z.enum(['weekly', 'monthly', 'yearly']).default('weekly'),
});
export type GetDashboardQuery = z.infer<typeof GetDashboardQuerySchema>;


export interface StatDetail {
    count: number;
    trend_value: number;
    is_positive: boolean;
}

export interface KpiResponse {
    total_reports: StatDetail;
    completed_reports: StatDetail;
    ongoing_reports: StatDetail;
}

export interface BarChartResponse {
    label: string;
    count: number;
}

export interface PieChartResponse {
    status: LaporanStatus;
    percentage: number;
    count: number;
}

export interface RecentActivityResponse {
    id: string;
    title: string;
    location: string;
    status: LaporanStatus;
    assignee_name: string | null;
    timestamp: Date;
}

export interface DashboardMainResponse {
    kpi: KpiResponse;
    bar_chart: BarChartResponse[];
    pie_chart: PieChartResponse[];
    recent_activities: RecentActivityResponse[];
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



const emptyToNull = (val: unknown) => (val === "" || val === undefined ? null : val);

export const UserSearchQuerySchema = z.object({
    search: z.preprocess(emptyToNull, z.string().nullable()),
    role_id: z.preprocess(emptyToNull, z.string().uuid({ message: "Format role_id harus UUID yang valid" }).nullable()),
});

export type UserSearchQuery = z.infer<typeof UserSearchQuerySchema>;
