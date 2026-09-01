import type { Prisma } from "../generated/prisma/client.js";
import type { StatsTugasQuery } from "../dto/admin.js";
import type { UserStatsRes } from "../types/admin.js";
import type { PaginatedResponse } from "../types/response.js";
import type { AssignObRepoArgs } from "../types/admin.js";


export type RecentLaporanPayload = {
    id: string;
    prioritas: string;
    status: string;
    created_at: Date;
    pelapor: { nama_lengkap: string } | null;
    lantai: {
        nomor_lantai: number;
        lokasi: { nama_lokasi: string } | null;
    } | null;
};

export type LaporanDetailPayload = Prisma.Laporan_karyawanGetPayload<{
    include: {
        pelapor: { omit: { password: true } };
        ob: { omit: { password: true } };
        lantai: { include: { lokasi: true } };
        kategori: true;
        histori_pekerjaan: true;
    };
}>;

export type AdminLaporanPayload = Prisma.Laporan_karyawanGetPayload<{
    include: {
        pelapor: { omit: { password: true } };
        ob: { omit: { password: true } };
        lantai: { include: { lokasi: true } };
        kategori: true;
    };
}>;

export type PenugasanObWithDetails = Prisma.PenugasanObGetPayload<{
    include: {
        ob: {
            select: {
                id: true;
                nama_lengkap: true;
                username: true;
                email: true;
            }
        };
        lokasi: true;
    };
}>;

export interface DailyChecklistObReport {
    nama_ob: string;
    lokasi: string;
    selesai: number;
    total: number;
    persentase: number;
}

export interface RiwayatTugasObReport {
    nama_ob: string;
    nama_tugas: string;
    kategori: string;
    durasi: string;
    status: string;
}

export interface StatsTugasResult {
    checklist: { total: number; diproses: number; menunggu: number };
    tugas: { total: number; diproses: number; menunggu: number };
}

export interface ObRankingRawData {
    ob_id: string;
    nama_lengkap: string;
    profile_picture: string | null;
    skills: Array<{
        skill_id: string;
        nama_skill: string;
        diperoleh_at: Date;
    }>;
    total_tugas_claimed: number;
    total_tugas_selesai: number;
    rata_rata_kecepatan: number;
}

export interface TrenLaporanBulananRaw {
    bulan: string;
    total: number;
    baru: number;
    sedang_dikerjakan: number;
    pending: number;
    selesai: number;
    dibatalkan: number;
}

export interface IAdminRepository {
    getObRanking(): Promise<ObRankingRawData[]>;
    getObStatsByPeriod(startDate: Date, endDate: Date): Promise<ObRankingRawData[]>;
    getLaporanMenungguInRange(startDate: Date, endDate: Date): Promise<number>;
    getTrenLaporanBulanan(startDate: Date): Promise<TrenLaporanBulananRaw[]>;
    assignObToLocations(obId: string, lokasiIds: string[], bulan: number, tahun: number): Promise<void>;
    getUserStats(): Promise<UserStatsRes>;
    getDailyChecklistOB(tanggal: Date): Promise<DailyChecklistObReport[]>;
    getRiwayatTugasOB(page: number, limit: number): Promise<PaginatedResponse<RiwayatTugasObReport>>
    getPenugasanByPeriode(bulan: number, tahun: number): Promise<PenugasanObWithDetails[]>;
    countTugasBelumDikerjakan(startDate: Date, endDate: Date): Promise<number>;
    countMenungguPersetujuan(startDate: Date, endDate: Date): Promise<number>;
    getStatsTugas(query: StatsTugasQuery): Promise<StatsTugasResult>;
    getStatsLaporan(query: StatsTugasQuery): Promise<{ laporan_baru: number; sedang_dikerjakan: number; selesai_hari_ini: number }>;
    getTotalApprovedTugas(): Promise<number>;
    getTotalReviewedLaporan(): Promise<number>;
    countActiveDays(userId: string): Promise<number>;
}
