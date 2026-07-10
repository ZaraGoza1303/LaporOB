import type { ChecklistHarianQuery } from "../dto/checklist_harian.js";
import type { PaginatedResponse } from "../dto/response.js";
import { Prisma } from "../generated/prisma/client.js";
import type { Checklist_harianUncheckedCreateInput, Checklist_harianUncheckedUpdateInput } from "../generated/prisma/models.js";

export type ChecklistHarianWithRelations = Prisma.Checklist_harianGetPayload<{
    include: { tugas: true, kategori: true, lantai: true, ob: true }
}>;

export interface IChecklistHarianRepository {
    getAll(page: number, limit: number, query: ChecklistHarianQuery): Promise<PaginatedResponse<ChecklistHarianWithRelations>>;
    getByID(checklist_harianId: string): Promise<ChecklistHarianWithRelations | null>
    insert(req: Checklist_harianUncheckedCreateInput): Promise<void>;
    update(checklist_harianId: string, req: Checklist_harianUncheckedUpdateInput): Promise<void>;
    delete(checklist_harianId: string): Promise<void>;

    countTotalChecklist(): Promise<number>;
    countTotalChecklistDone(): Promise<number>;
    countTotalChecklistPending(): Promise<number>;
    countTotalChecklistLate(): Promise<number>;
}
