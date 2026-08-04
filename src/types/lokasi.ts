import type { LokasiGetPayload } from "../generated/prisma/models.js";

export type LokasiWithLantai = LokasiGetPayload<{
    include: {
        lantai: true
    }
}>;

export interface LantaiRes {
    id: string;
    nomor_lantai: number;
}

export interface LokasiRes {
    id: string;
    nama_lokasi: string;
    alamat: string | null;
    jumlah_lantai: number;
    lantai: LantaiRes[];
    created_at: Date;
    updated_at: Date;
}
