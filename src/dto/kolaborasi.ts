import { z } from "zod";

export const LaporanIdParams = z.object({
    laporan_id: z.string().uuid(),
});

export const KolaborasiIdParams = z.object({
    kolaborasi_id: z.string().uuid(),
    laporan_id: z.string().uuid(),
});

export type LaporanIdParams = z.infer<typeof LaporanIdParams>;
export type KolaborasiIdParams = z.infer<typeof KolaborasiIdParams>;

export interface GabungResponse {
    id: string;
    laporan_id: string;
    ob_id: string;
    status: string;
    created_at: string;
}

export interface DaftarGabungItem {
    id: string;
    ob: {
        id: string;
        nama_lengkap: string;
    };
    status: string;
    created_at: string;
}

export type KolaborasiStatus = "PENDING" | "APPROVED" | "REJECTED";
