import type { Laporan_karyawan, User } from "../generated/prisma/client.js";

export interface IObRepository {
    getObById(obId: string): Promise<User | null>;
    getTodayChecklists(obId: string, tanggal: Date): Promise<any[]>;
    countTodayChecklists(obId: string, tanggal: Date): Promise<number>;
    getReports(obId: string): Promise<any[]>;
    ambilLaporan(laporanId: string, obId: string): Promise<void>;
    createHistoriPekerjaan(laporanId: string, fotoSelesai: string[], catatan: string): Promise<void>;
    tolakLaporan(laporanId: string, fotoSelesai: string[], catatan: string): Promise<void>;
}