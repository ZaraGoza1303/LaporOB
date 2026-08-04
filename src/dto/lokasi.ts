import z from "zod";

export const LokasiIdParamSchema = z.object({
    lokasi_id: z.string().trim().uuid({ message: "Format lokasi_id harus UUID yang valid" })
});

export const CreateLokasiSchema = z.object({
    nama_lokasi: z.string().trim().min(1, { message: "Nama lokasi tidak boleh kosong" }).max(100, { message: "Nama lokasi maksimal 100 karakter" }),
    jumlah_lantai: z.number().int().min(1, { message: "Jumlah lantai minimal 1" }),
    alamat: z.string().trim().max(255, { message: "Alamat maksimal 255 karakter" }).optional()
});

export const UpdateLokasiSchema = z.object({
    nama_lokasi: z.string().trim().min(1, { message: "Nama lokasi tidak boleh kosong" }).max(100, { message: "Nama lokasi maksimal 100 karakter" }).optional(),
    jumlah_lantai: z.number().int().min(1, { message: "Jumlah lantai minimal 1" }).optional(),
    alamat: z.string().trim().max(255, { message: "Alamat maksimal 255 karakter" }).optional()
});

export type CreateLokasiReq = z.infer<typeof CreateLokasiSchema>;
export type UpdateLokasiReq = z.infer<typeof UpdateLokasiSchema>;


