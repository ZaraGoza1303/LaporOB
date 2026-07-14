import type { Prisma, Laporan_karyawan } from "../generated/prisma/client.js";
import type { AdminLaporanQuery, UserStatsRes, DailyChecklistObPayload } from "../dto/admin.js";
import type { PaginatedResponse } from "../dto/response.js";
import type { AssignObRepoArgs } from "../dto/admin.js";


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

export interface ReportSummaryPayload {
    id: string;
    status: string;
    prioritas: string;
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

export interface IAdminRepository {
    assignObToLocations(obId: string, lokasiIds: string[], bulan: number, tahun: number): Promise<void>;
    getUserStats(): Promise<UserStatsRes>;
    getDailyChecklistOB(tanggal: Date): Promise<DailyChecklistObReport[]>;
    getPenugasanByPeriode(bulan: number, tahun: number): Promise<PenugasanObWithDetails[]>;
    approveLaporan(laporanId: string, catatan?: string): Promise<Laporan_karyawan>;
    rejectLaporan(laporanId: string, catatan: string): Promise<Laporan_karyawan>;
}
