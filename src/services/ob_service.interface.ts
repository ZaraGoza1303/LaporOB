import type { ObHomeRes, CreateHistoriReq } from "../dto/ob.js";

export interface IObService {
    getHomeStats(obId: string): Promise<ObHomeRes>;
    ambilLaporan(laporanId: string, obId: string): Promise<void>;
    createHistoriPekerjaan(laporanId: string, fotoUrls: string[], dto: CreateHistoriReq): Promise<void>;
}