import { z } from "zod";
import { CHECKLIST_STATUS } from "../utils/constants.js";
import type { Kategori, Lantai, User } from "../generated/prisma/client.js";

export const ChecklistHarianIdParamSchema = z.object({
    checklist_harian_id: z.string().trim().uuid({ message: "Format checklist_harian_id harus UUID yang valid" })
});

export const UpdateChecklistHarianSchema = z.object({
    nama_tugas: z.string().min(1).max(150).optional(),
    kategori_id: z.string().trim().uuid({ message: "Format kategori_id harus berupa UUID yang valid" }).optional(),
    lantai_id: z.string().trim().uuid({ message: "Format lantai_id harus berupa UUID yang valid" }).optional(),
    ob_id: z.string().trim().uuid({ message: "Format ob_id harus berupa UUID yang valid" }).optional().nullable(),
    status: z.enum([CHECKLIST_STATUS.BELUM_DIKERJAKAN, CHECKLIST_STATUS.SEDANG_DIKERJAKAN, CHECKLIST_STATUS.SELESAI, CHECKLIST_STATUS.TERLEWAT]).optional(),
    catatan: z.string().optional(),
});

export type UpdateChecklistHarianReq = z.infer<typeof UpdateChecklistHarianSchema>;

export interface ChecklistHarianRes {
    id: string;
    nama_tugas: string;
    kategori_id: string;
    lantai_id: string;
    ob_id?: string | null;
    status: string;
    catatan?: string | null;
    dikerjakan_at?: Date | null;
    selesai_at?: Date | null;
    terlewat_at?: Date | null;
    total_durasi?: number | null;
    tanggal: Date;
    created_at: Date;
    updated_at: Date;
    kategori?: Kategori;
    lantai?: Lantai;
    ob?: User | null;
}


