import type { ChecklistHarianQuery } from "../dto/checklist_harian.js";
import type { PaginatedResponse } from "../dto/response.js";
import { Prisma } from "../generated/prisma/client.js";
import type { Checklist_harian } from "../generated/prisma/client.js";
import type { Checklist_harianUncheckedCreateInput, Checklist_harianUncheckedUpdateInput } from "../generated/prisma/models.js";
import type { PeriodRange } from "../utils/date.js";

export type ChecklistHarianWithRelations = Prisma.Checklist_harianGetPayload<{
    include: { kategori: true, lantai: true, ob: true }
}>;

export type ChecklistHarianWithDetails = Prisma.Checklist_harianGetPayload<{
    include: {
        kategori: true;
        lantai: {
            include: {
                lokasi: true;
            };
        };
    };
}>;

export interface IChecklistHarianRepository {
    getAll(page: number, limit: number, query: ChecklistHarianQuery): Promise<PaginatedResponse<ChecklistHarianWithRelations>>;
    getByID(checklist_harianId: string): Promise<ChecklistHarianWithRelations | null>
    insert(req: Checklist_harianUncheckedCreateInput): Promise<void>;
    update(checklist_harianId: string, req: Checklist_harianUncheckedUpdateInput): Promise<void>;
    delete(checklist_harianId: string): Promise<void>;

    countTotalChecklist(dateRange?: PeriodRange): Promise<number>;
    countTotalChecklistDone(dateRange?: PeriodRange): Promise<number>;
    countTotalChecklistPending(dateRange?: PeriodRange): Promise<number>;
    countTotalChecklistLate(dateRange?: PeriodRange): Promise<number>;
    insertMany(data: Checklist_harianUncheckedCreateInput[]): Promise<void>;

    /** For OB dashboard: get today's checklists for an OB */
    getTodayChecklists(obId: string, tanggal: Date): Promise<ChecklistHarianWithDetails[]>;
    /** For OB dashboard: count today's checklists for an OB */
    countTodayChecklists(obId: string, tanggal: Date): Promise<number>;
    /** For OB: take/claim a checklist */
    ambilChecklist(checklistId: string, obId: string): Promise<void>;
}
