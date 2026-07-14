import type { ObHomeRes, CreateHistoriReq } from "../dto/ob.js";
import type { MappedProfileReport, MappedReportDetailRes, ProfileRes, ObProfileResponse } from "../dto/users.js";
import type { PaginatedResponse } from "../dto/response.js";
import type { PeriodRange } from "../utils/date.js";
import type { RiwayatParams } from "./karyawan_service.interface.js";

export interface IObService {
    getHomeStats(obId: string): Promise<ObHomeRes>;
    ambilLaporan(laporanId: string, obId: string): Promise<void>;
    ambilChecklist(checklistId: string, obId: string): Promise<void>;
    createHistoriPekerjaan(laporanId: string, fotoUrls: string[], dto: CreateHistoriReq, obId: string): Promise<void>;
    tolakLaporan(laporanId: string, fotoUrls: string[], dto: CreateHistoriReq, obId: string): Promise<void>;
    getRiwayat(obId: string, limit: number, params: RiwayatParams): Promise<PaginatedResponse<MappedProfileReport>>;
    getDetailRiwayat(obId: string, laporanId: string): Promise<MappedReportDetailRes>;
    getObPerformanceStats(obId: string, dateRange?: PeriodRange): Promise<{ laporanDiterima: number, laporanSelesai: number }>;
    getProfile(obId: string): Promise<ObProfileResponse>;
}
