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
    lantai_id: z.string().uuid({ message: "Format Lantai ID harus berupa UUID yang valid" }).nullable().optional(),
    catatan: z.string().trim().nullable().optional(),
    ob_id: z.string().uuid({ message: "Format OB ID harus berupa UUID yang valid" }).nullable().optional(),
    status: z.enum(["BELUM_DIKERJAKAN", "SEDANG_DIKERJAKAN", "SELESAI", "TERLEWAT"]).optional(),
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

export type CreateTugasReq = z.infer<typeof CreateTugasSchema>;
export type UpdateTugasReq = z.infer<typeof UpdateTugasSchema>;
export type TugasQuery = z.infer<typeof TugasQuerySchema>;
