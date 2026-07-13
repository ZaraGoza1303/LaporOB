import { z } from "zod";

export interface ObHomeRes {
    ob: {
        nama_lengkap: string;
    };
    tugas_harian_stats: {
        total: number;
        resolved: number;
        pending: number;
    };
    tugas_harian: Array<{
        id: string;
        nama_tugas: string;
        kategori: string;
        lokasi: string;
        nomor_lantai: number;
        status: string;
        tanggal: string;
    }>;
    laporan: Array<{
        id: string;
        kategori: string;
        deskripsi_kendala: string;
        status: string;
        foto_masalah: string[];
        lokasi: string;
        nomor_lantai: number;
        priority: string;
        created_at: string;
    }>;


}

export const CreateHistoriSchema = z.object({
    catatan: z.string().min(5, "Keterangan minimal 5 karakter"),
}).refine(() => true);

export type CreateHistoriReq = z.infer<typeof CreateHistoriSchema>;

export const ChecklistIdParamSchema = z.object({
    checklist_id: z.string().uuid({ message: "Format checklist_id harus UUID yang valid" }),
});
