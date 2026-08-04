import { z } from "zod";

export const CreateHistoriSchema = z.object({
    catatan: z.string().min(5, "Keterangan minimal 5 karakter"),
}).refine(() => true);

export type CreateHistoriReq = z.infer<typeof CreateHistoriSchema>;

export const ChecklistIdParamSchema = z.object({
    checklist_id: z.string().uuid({ message: "Format checklist_id harus UUID yang valid" }),
});

// export interface ObTugasItem {
//     id: string;
//     nama_tugas: string;
//     kategori: string;
//     lantai_id: string | null;
//     lokasi: string;
//     nomor_lantai: number;
//     status: string;
//     catatan: string | null;
//     created_at: string;
// }

export const ObTugasIdParamSchema = z.object({
    tugas_id: z.string().uuid({ message: "Format tugas_id harus UUID yang valid" }),
});
