import z from "zod"

export type CreateCategoryReq = {
    nama_kategori: string;
}

export type UpdateCategoryReq = {
    id?: string;
    nama_kategori: string;
}

export const CreateCategorySchema = z.object({
    nama_kategori: z.string().min(1, 'nama_kategori required'),
})

export const UpdateCategorySchema = z.object({
    nama_kategori: z.string().min(1, 'nama_kategori required'),
})
