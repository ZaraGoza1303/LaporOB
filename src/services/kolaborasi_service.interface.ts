import type { GabungResponse, DaftarGabungItem } from "../dto/kolaborasi.js";

export interface IKolaborasiService {
    gabung(laporanId: string, obId: string): Promise<GabungResponse>;
    setujui(kolaborasiId: string, laporanId: string, primaryObId: string): Promise<void>;
    tolak(kolaborasiId: string, laporanId: string, primaryObId: string): Promise<void>;
    daftarRequest(laporanId: string, obId: string): Promise<DaftarGabungItem[]>;
    isKolaborator(laporanId: string, obId: string): Promise<boolean>;
    keluar(laporanId: string, obId: string): Promise<void>;
    keluarkan(kolaborasiId: string, laporanId: string, primaryObId: string): Promise<void>;
}
