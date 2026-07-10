import type { ObHomeRes, CreateHistoriReq } from "../dto/ob.js";
import type { MappedProfileReport, ProfileRes } from "../dto/users.js";
import type { PaginatedResponse } from "../dto/response.js";

export interface IObService {
    getHomeStats(obId: string): Promise<ObHomeRes>;
    ambilLaporan(laporanId: string, obId: string): Promise<void>;
    createHistoriPekerjaan(laporanId: string, fotoUrls: string[], dto: CreateHistoriReq): Promise<void>;
    tolakLaporan(laporanId: string, fotoUrls: string[], dto: CreateHistoriReq): Promise<void>;
    getRiwayat(obId: string, limit: number, params: { cursor?: string | null; search?: string | null; status?: string | null }): Promise<PaginatedResponse<MappedProfileReport>>;
    getObPerformanceStats(obId: string): Promise<{ tasksCompleted: number, komplain_ditangani: number; rejected: number }>;
    getProfile(obId: string): Promise<{
        id: string;
        nama_lengkap: string;
        username: string;
        email: string;
        role: string;
        profile_picture: string | null;
        tasksCompleted: number;
        komplain_ditangani: number;
        rejected: number;
    }>
}
