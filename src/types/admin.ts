import { Prisma } from "../generated/prisma/client.js";
import type { LaporanPriority, LaporanStatus } from "../utils/constants.js";
import type { PaginatedResponse } from "./response.js";
import type { ChecklistHarianRes } from "./checklist_harian.js";
import type { TugasDetailRes } from "./tugas.js";

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
    tugas_belum_dikerjakan: StatDetail;
    menunggu_persetujuan: StatDetail;
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

export interface RiwayatTugasOBResponse {
    nama_ob: string;
    nama_tugas: string;
    kategori: string;
    durasi: string;
    status: string;
}

export interface DashboardMainResponse {
    kpi: KpiResponse;
    bar_chart: BarChartResponse[];
    pie_chart: PieChartResponse[];
    recent_activities: PaginatedResponse<RecentActivityResponse>;
    daily_checklist_ob: DailyChecklistOBResponse[];
    riwayat_tugas_ob: PaginatedResponse<RiwayatTugasOBResponse>;
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
    catatan_ob: string | null;
    total_durasi: number | null;
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

export interface InformasiStatusResponse {
    mendesak: number;
    standar: number;
    dibatalkan: number;
    menunggu: number;
    sedang_dikerjakan: number;
    selesai: number;
}

export interface LaporanAktifResponse {
    total_laporan: number;
}

export interface AdminLaporanPageResponse {
    laporan: PaginatedResponse<AdminLaporanItemResponse>;
    informasi_status: InformasiStatusResponse;
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

export interface StatsTugasResponse {
    total: number;
    diproses_ob: number;
    menunggu_persetujuan: number;
}

export interface StatsLaporanResponse {
    laporan_baru: number;
    sedang_dikerjakan: number;
    selesai_hari_ini: number;
}

export interface AdminProfileData {
    total_tugas_approved: number;
    laporan_direview: number;
    hari_aktif: number;
}

export interface ApprovalItemResponse {
    id: string;
    nama_tugas: string;
    nama_ob: string | null;
    lokasi: string | null;
    kategori: string | null;
    selesai_at: Date | null;
}

export interface PekerjaanListResponse {
    checklist: PaginatedResponse<ChecklistHarianRes>;
    tugas: PaginatedResponse<TugasDetailRes>;
}

export interface ObPerbandinganItem {
    ob_id: string;
    nama_ob: string;
    total_tugas: number;
    tugas_selesai: number;
    persentase: number;
}

export interface TrenLaporanBulananItem {
    bulan: string;
    label: string;
    total: number;
    baru: number;
    sedang_dikerjakan: number;
    pending: number;
    selesai: number;
    dibatalkan: number;
}

export interface ObPerformanceDashboardResponse {
    produktivitas: number;
    tugas_diselesaikan: { selesai: number; total: number };
    laporan_menunggu: number;
    perbandingan_ob: ObPerbandinganItem[];
    tren_laporan_bulanan: TrenLaporanBulananItem[];
}

export interface ObRankingItem {
    ob: {
        id: string;
        nama_lengkap: string;
        profile_picture: string | null;
        skills: Array<{
            id: string;
            nama_skill: string;
            diperoleh_at: Date;
        }>;
    };
    total_tugas_claimed: number;
    total_tugas_selesai: number;
    rata_rata_kecepatan: number;
}
