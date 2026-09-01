import { z } from "zod";
import { CHECKLIST_STATUS } from "../utils/constants.js";

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



