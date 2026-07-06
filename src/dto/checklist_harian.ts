import { z } from "zod";
import { CHECKLIST_STATUS } from "../utils/constants.js";

export interface ChecklistHarianQuery {
    search?: string | null;
    lokasi_id?: string | null;
    lantai_id?: string | null;
    status?: string | null;
}

export const CreateChecklistHarianSchema = z.object({
    tugas_id: z.string().min(1, "Tugas ID wajib diisi"),
    kategori_id: z.string().min(1, "Kategori ID wajib diisi"),
    lokasi_id: z.string().min(1, "Lokasi ID wajib diisi"),
    lantai_id: z.string().min(1, "Lantai ID wajib diisi"),
});

export const UpdateChecklistHarianSchema = z.object({
    tugas_id: z.string().optional(),
    kategori_id: z.string().optional(),
    lokasi_id: z.string().optional(),
    lantai_id: z.string().optional(),
    ob_id: z.string().optional(),
    status: z.enum([CHECKLIST_STATUS.BELUM_DIKERJAKAN, CHECKLIST_STATUS.SEDANG_DIKERJAKAN, CHECKLIST_STATUS.SELESAI, CHECKLIST_STATUS.TERLEWAT]).optional(),
    catatan: z.string().optional(),
});

export type CreateChecklistHarianReq = z.infer<typeof CreateChecklistHarianSchema>;
export type UpdateChecklistHarianReq = z.infer<typeof UpdateChecklistHarianSchema>;

export interface ChecklistHarianRes {
    id: string;
    tugas_id?: string;
    kategori_id?: string;
    lokasi_id?: string;
    lantai_id?: string;
    ob_id?: string;
    status: string;
    catatan?: string | null;
    created_at: Date;
    updated_at: Date;
    tugas?: any;
    kategori?: any;
    lantai?: any;
    ob?: any;
}
