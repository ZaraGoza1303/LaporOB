import type { ObHomeRes, UpdateLaporanReq } from "../dto/ob.js";
import type { Laporan_karyawan } from "../generated/prisma/client.js";

export interface IObService {
    getHomeStats(obId: string): Promise<ObHomeRes>;
    updatelaporStatus( laporanId: string, obId: string, dto: UpdateLaporanReq): Promise<void>;
}