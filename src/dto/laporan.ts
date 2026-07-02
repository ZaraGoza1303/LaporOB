import { create } from "node:domain";
import z from "zod";

export const CreateLaporanSchema = z.object({
    lantai_id: z.string().uuid("ID Lantai Harus format UUID"),
    kategori_id: z.string().uuid("ID Kategori harus format UUID"),
    deskripsi_kendala: z.string().min(5, "Deskripsi kendala minimal 5 karakter"),
    foto_masalah: z.string().min(1, "Foto Bukti kendala harus ada")
});

export type CreateLaporanReq = z.infer<typeof CreateLaporanSchema>;

export type LaporanResponseData = {
    id: String;
    pelapor_id: String;
    ob_id: String;
    lantai_id: String;
    kategori_id: String;
    deskripsi_kendala: String;
    status: String;
    foto_masalah: String;
    created_at: Date;
}