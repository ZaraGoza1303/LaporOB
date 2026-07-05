import type { ChecklistHarianQuery } from "../dto/checklist_harian.js";
import type { PaginatedResponse } from "../dto/response.js";
import type { Checklist_harian } from "../generated/prisma/client.js";
import type { Checklist_harianUncheckedCreateInput, Checklist_harianUncheckedUpdateInput } from "../generated/prisma/models.js";

export interface IChecklistHarianRepository {
    getAll(page: number, limit: number, query: ChecklistHarianQuery): Promise<PaginatedResponse<Checklist_harian>>;
    getByID(checklist_harianId: string): Promise<Checklist_harian | null>
    insert(req: Checklist_harianUncheckedCreateInput): Promise<void>;
    update(checklist_harianId: string, req: Checklist_harianUncheckedUpdateInput): Promise<void>;
    delete(checklist_harianId: string): Promise<void>;
}