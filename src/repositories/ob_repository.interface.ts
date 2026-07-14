import type { User, Prisma } from "../generated/prisma/client.js";
import type { PeriodRange } from "../utils/date.js";

export type ChecklistHarianWithDetails = Prisma.Checklist_harianGetPayload<{
    include: {
        tugas: true;
        kategori: true;
        lantai: {
            include: {
                lokasi: true;
            };
        };
    };
}>;

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

export interface IObRepository {
    getObById(obId: string): Promise<User | null>;
    getTodayChecklists(obId: string, tanggal: Date): Promise<ChecklistHarianWithDetails[]>;
    countTodayChecklists(obId: string, tanggal: Date): Promise<number>;
    getReports(obId: string): Promise<LaporanKaryawanWithDetails[]>;
    ambilLaporan(laporanId: string, obId: string): Promise<void>;
    ambilChecklist(checklistId: string, obId: string): Promise<void>;
    createHistoriPekerjaan(laporanId: string, obId: string, fotoSelesai: string[], catatan: string): Promise<void>;
    tolakLaporan(laporanId: string, obId: string, fotoSelesai: string[], catatan: string): Promise<void>;
    getObPerformanceStats(obId: string, dateRange?: PeriodRange): Promise<{ laporanDiterima: number, laporanSelesai: number }>;
}