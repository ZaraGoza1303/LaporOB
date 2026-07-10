import z from "zod";

export const TugasIdParamSchema = z.object({
    tugas_id: z.string().trim().uuid({ message: "Format tugas_id harus UUID yang valid" })
});

export const CreateTugasSchema = z.object({
    kategori_id: z.string().uuid({ message: "Format Kategori ID harus berupa UUID yang valid" }),
    nama_tugas: z.string().min(1, { message: "Nama tugas tidak boleh kosong" }).max(150, { message: "Nama tugas maksimal 150 karakter" }),
    is_active: z.boolean().optional().default(true),
});

export const UpdateTugasSchema = CreateTugasSchema.partial();

export const TugasQuerySchema = z.object({
    kategori_id: z.string().uuid({ message: "Format Kategori ID harus berupa UUID yang valid" }),
});

export type CreateTugasReq = z.infer<typeof CreateTugasSchema>;
export type UpdateTugasReq = z.infer<typeof UpdateTugasSchema>;
export type TugasQuery = z.infer<typeof TugasQuerySchema>;
