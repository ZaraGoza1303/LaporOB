import z from "zod";

export const JadwalChecklistIdParamSchema = z.object({
    jadwal_checklist_id: z.string().trim().uuid({ message: "Format jadwal_checklist_id harus UUID yang valid" }),
});

export const CreateJadwalChecklistSchema = z.object({
    nama_tugas: z.string().min(1, { message: "Nama tugas wajib diisi" }).max(150, { message: "Maksimal 150 karakter" }),
    kategori_id: z.string().trim().uuid({ message: "Format kategori_id harus berupa UUID yang valid" }),
    lantai_id: z.string().trim().uuid({ message: "Format lantai_id harus berupa UUID yang valid" }),
    ob_id: z.string().trim().uuid({ message: "Format ob_id harus berupa UUID yang valid" }).optional(),
    hari: z.array(z.string()).optional(),
});

export const UpdateJadwalChecklistSchema = z.object({
    nama_tugas: z.string().min(1).max(150).optional(),
    kategori_id: z.string().trim().uuid().optional(),
    lantai_id: z.string().trim().uuid().optional(),
    ob_id: z.string().trim().uuid().optional().nullable(),
    hari: z.array(z.string()).optional(),
});

export type CreateJadwalChecklistReq = z.infer<typeof CreateJadwalChecklistSchema>;
export type UpdateJadwalChecklistReq = z.infer<typeof UpdateJadwalChecklistSchema>;
