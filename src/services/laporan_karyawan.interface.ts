import type { CreateLaporanReq } from "../dto/laporan.js"

export interface ILaporanKaryawanService {
  createLaporan(pelapor_id: string, data: CreateLaporanReq): Promise<any>;
  getAllLaporan(): Promise<any[]>;
  getDetailLaporan(id: string): Promise<any>;
  updateStatusLaporan(laporanId: string, obId: string, statusBaru: string): Promise<any>;
}