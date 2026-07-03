import z from "zod";
import type { LokasiGetPayload } from "../generated/prisma/models.js";

export type LokasiWithLantai = LokasiGetPayload<{
    include: {
        lantai: true
    }
}>;

export const CreateLokasiSchema = z.object({
    nama_lokasi: z.string().min(1, { message: "Nama lokasi tidak boleh kosong" }).max(100, { message: "Nama lokasi maksimal 100 karakter" }),
    jumlah_lantai: z.number().int().min(1, { message: "Jumlah lantai minimal 1" })
});

export const UpdateLokasiSchema = z.object({
    nama_lokasi: z.string().min(1, { message: "Nama lokasi tidak boleh kosong" }).max(100, { message: "Nama lokasi maksimal 100 karakter" }).optional(),
    jumlah_lantai: z.number().int().min(1, { message: "Jumlah lantai minimal 1" }).optional()
});

export type CreateLokasiReq = z.infer<typeof CreateLokasiSchema>;
export type UpdateLokasiReq = z.infer<typeof UpdateLokasiSchema>;

export interface LantaiRes {
    id: string;
    nomor_lantai: number;
}

export interface LokasiRes {
    id: string;
    nama_lokasi: string;
    jumlah_lantai: number;
    lantai: LantaiRes[];
    created_at: Date;
    updated_at: Date;
}
