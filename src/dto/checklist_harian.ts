import { z } from "zod";
import { CHECKLIST_STATUS } from "../utils/constants.js";
import type { Period } from "../utils/date.js";
import type { PaginatedResponse } from "./response.js";
import type { Tugas, Kategori, Lantai, User } from "../generated/prisma/client.js";

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
    period: z.enum(['harian', 'mingguan', 'bulanan', 'tahunan']).default('harian'),
});

export type ChecklistHarianQuery = z.infer<typeof ChecklistHarianQuerySchema>;

export const ChecklistHarianIdParamSchema = z.object({
    checklist_harian_id: z.string().trim().uuid({ message: "Format checklist_harian_id harus UUID yang valid" })
});

export const CreateChecklistHarianSchema = z.object({
    tugas_id: z.string().trim().uuid({ message: "Format tugas_id harus berupa UUID yang valid" }),
    kategori_id: z.string().trim().uuid({ message: "Format kategori_id harus berupa UUID yang valid" }),
    lokasi_id: z.string().trim().uuid({ message: "Format lokasi_id harus berupa UUID yang valid" }),
    lantai_id: z.string().trim().uuid({ message: "Format lantai_id harus berupa UUID yang valid" }),
    ob_id: z.string().trim().uuid({ message: "Format ob_id harus berupa UUID yang valid" }).optional(),
});

export const UpdateChecklistHarianSchema = z.object({
    tugas_id: z.string().trim().uuid({ message: "Format tugas_id harus berupa UUID yang valid" }).optional(),
    kategori_id: z.string().trim().uuid({ message: "Format kategori_id harus berupa UUID yang valid" }).optional(),
    lokasi_id: z.string().trim().uuid({ message: "Format lokasi_id harus berupa UUID yang valid" }).optional(),
    lantai_id: z.string().trim().uuid({ message: "Format lantai_id harus berupa UUID yang valid" }).optional(),
    ob_id: z.string().trim().uuid({ message: "Format ob_id harus berupa UUID yang valid" }).optional(),
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
    ob_id?: string | null;
    status: string;
    catatan?: string | null;
    dikerjakan_at?: Date | null;
    selesai_at?: Date | null;
    terlewat_at?: Date | null;
    created_at: Date;
    updated_at: Date;
    tugas?: Tugas;
    kategori?: Kategori;
    lantai?: Lantai;
    ob?: User | null;
}

export interface ChecklistCountsResponse {
    total: number;
    done: number;
    pending: number;
    late: number;
}

export interface ChecklistHarianGroupedByOB {
    ob_id: string | null;
    ob: User | null;
    items: ChecklistHarianRes[];
}

export interface ChecklistHarianPageResponse {
    checklist: PaginatedResponse<ChecklistHarianGroupedByOB>;
    counts: ChecklistCountsResponse;
}