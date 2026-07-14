import type { KolaborasiLaporan } from "../generated/prisma/client.js";

export interface KolaborasiLaporanWithOb extends KolaborasiLaporan {
    ob: {
        id: string;
        nama_lengkap: string;
    };
}

export interface IKolaborasiRepository {
    findById(id: string): Promise<KolaborasiLaporan | null>;
    findByLaporanAndOb(laporanId: string, obId: string): Promise<KolaborasiLaporan | null>;
    findPendingByLaporanId(laporanId: string): Promise<KolaborasiLaporanWithOb[]>;
    findApprovedByLaporanId(laporanId: string): Promise<KolaborasiLaporanWithOb[]>;
    findApprovedByObId(obId: string): Promise<KolaborasiLaporan[]>;
    create(laporanId: string, obId: string): Promise<KolaborasiLaporan>;
    updateStatus(id: string, status: string): Promise<KolaborasiLaporan>;
    countByLaporanAndStatus(laporanId: string, status: string): Promise<number>;
}
