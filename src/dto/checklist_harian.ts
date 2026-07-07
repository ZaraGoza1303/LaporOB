import { z } from "zod";
import { CHECKLIST_STATUS } from "../utils/constants.js";

const emptyToNull = (val: unknown) => (val === "" || val === undefined ? null : val);

const checklistStatusValues = [
    CHECKLIST_STATUS.BELUM_DIKERJAKAN,
    CHECKLIST_STATUS.SEDANG_DIKERJAKAN,
    CHECKLIST_STATUS.SELESAI,
    CHECKLIST_STATUS.TERLEWAT,
] as const;

export const ChecklistHarianQuerySchema = z.object({
    search: z.preprocess(emptyToNull, z.string().nullable()),
    lokasi_id: z.preprocess(emptyToNull, z.string().uuid().nullable()),
    lantai_id: z.preprocess(emptyToNull, z.string().uuid().nullable()),
    status: z.preprocess(emptyToNull, z.enum(checklistStatusValues).nullable()),
});

export type ChecklistHarianQuery = z.infer<typeof ChecklistHarianQuerySchema>;

export const CreateChecklistHarianSchema = z.object({
    tugas_id: z.string().min(1, "Tugas ID wajib diisi"),
    kategori_id: z.string().min(1, "Kategori ID wajib diisi"),
    lokasi_id: z.string().min(1, "Lokasi ID wajib diisi"),
    lantai_id: z.string().min(1, "Lantai ID wajib diisi"),
    tanggal: z.string().min(1, "Tanggal wajib diisi").refine((val) => !Number.isNaN(Date.parse(val)), { message: "Format tanggal tidak valid" }),
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
