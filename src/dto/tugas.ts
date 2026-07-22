import z from "zod";

export const TugasIdParamSchema = z.object({
    tugas_id: z.string().trim().uuid({ message: "Format tugas_id harus UUID yang valid" })
});

export const CreateTugasSchema = z.object({
    kategori_id: z.string().uuid({ message: "Format Kategori ID harus berupa UUID yang valid" }),
    nama_tugas: z.string().trim().min(1, { message: "Nama tugas tidak boleh kosong" }).max(150, { message: "Nama tugas maksimal 150 karakter" }),
    lantai_id: z.string().uuid({ message: "Format Lantai ID harus berupa UUID yang valid" }).optional(),
    catatan: z.string().trim().optional(),
    hari: z.array(z.string()).optional(),
    tanggal_ulang: z.coerce.number().int().min(1).max(31).nullable().optional(),
    tanggal_spesifik: z.array(z.string()).optional(),
    tanggal_mulai: z.string().optional(),
    tanggal_selesai: z.string({ message: "tanggal_selesai wajib diisi" }),
    is_active: z.boolean().optional().default(true),
});

export const UpdateTugasSchema = z.object({
    kategori_id: z.string().uuid({ message: "Format Kategori ID harus berupa UUID yang valid" }).optional(),
    nama_tugas: z.string().trim().min(1, { message: "Nama tugas tidak boleh kosong" }).max(150, { message: "Nama tugas maksimal 150 karakter" }).optional(),
    hari: z.array(z.string()).optional(),
    tanggal_ulang: z.coerce.number().int().min(1).max(31).nullable().optional(),
    tanggal_spesifik: z.array(z.string()).optional(),
    tanggal_mulai: z.string().optional(),
    tanggal_selesai: z.string().optional(),
    is_active: z.boolean().optional(),
});

export const TugasQuerySchema = z.object({
    kategori_id: z.string().uuid({ message: "Format Kategori ID harus berupa UUID yang valid" }).optional(),
});

export interface TugasDetailRes {
    id: string;
    nama_tugas: string;
    kategori: { id: string; nama_kategori: string } | null;
    lantai: { id: string; nomor_lantai: number; lokasi: { id: string; nama_lokasi: string } } | null;
    ob: { id: string; nama_lengkap: string } | null;
    status: string;
    catatan: string | null;
    dikerjakan_at: Date | null;
    selesai_at: Date | null;
    total_durasi: number | null;
    hari: string[];
    is_approved: boolean;
    approved_at: Date | null;
    created_at: Date;
    updated_at: Date;
}

export type CreateTugasReq = z.infer<typeof CreateTugasSchema>;
export type UpdateTugasReq = z.infer<typeof UpdateTugasSchema>;
export type TugasQuery = z.infer<typeof TugasQuerySchema>;
