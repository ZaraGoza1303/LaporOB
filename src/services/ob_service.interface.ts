import type { ObHomeRes, CreateHistoriReq } from "../dto/ob.js";
import type { MappedProfileReport } from "../dto/users.js";
import type { PaginatedResponse } from "../dto/response.js";
import type { PeriodRange } from "../utils/date.js";

export interface IObService {
    getHomeStats(obId: string): Promise<ObHomeRes>;
    ambilLaporan(laporanId: string, obId: string): Promise<void>;
    createHistoriPekerjaan(laporanId: string, fotoUrls: string[], dto: CreateHistoriReq, obId: string): Promise<void>;
    tolakLaporan(laporanId: string, fotoUrls: string[], dto: CreateHistoriReq, obId: string): Promise<void>;
    getRiwayat(obId: string, limit: number, params: { cursor?: string | null; search?: string | null; status?: string | null }): Promise<PaginatedResponse<MappedProfileReport>>;
    getObPerformanceStats(obId: string, dateRange?: PeriodRange): Promise<{ laporanDiterima: number, laporanSelesai: number }>;
}
