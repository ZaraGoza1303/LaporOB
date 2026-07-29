import type { CreateLaporanKaryawanInput, UserHomeRes, MappedProfileReport } from '../types/users.js';
import type { PaginatedResponse } from '../types/response.js';
import type { KaryawanPerformanceRes } from '../types/karyawan.js';

export interface RiwayatParams {
    cursor?: string | null;
    search?: string | null;
    status?: string | null;
}

export interface IKaryawanService {
    getHomeStats(userId: string): Promise<UserHomeRes>
    getKaryawanPerformanceStats(userId: string): Promise<KaryawanPerformanceRes>;
    getRiwayat(userId: string, limit: number, params: RiwayatParams): Promise<PaginatedResponse<MappedProfileReport>>;
    createReport(userId: string, req: CreateLaporanKaryawanInput): Promise<void>;
}
