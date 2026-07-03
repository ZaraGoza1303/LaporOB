import z from "zod";

export const CreateKategoriSchema = z.object({
    nama_kategori: z.string().min(1, { message: "Nama kategori tidak boleh kosong" }).max(100, { message: "Nama kategori maksimal 100 karakter" }),
})

export const UpdateKategoriSchema = CreateKategoriSchema.extend({})

export type CreateKategoriReq  = z.infer<typeof CreateKategoriSchema>;
export type UpdateKategoriReq  = z.infer<typeof UpdateKategoriSchema>;