import type { ChecklistHarianQuery, CreateChecklistHarianReq, UpdateChecklistHarianReq, ChecklistHarianRes } from "../dto/checklist_harian.js";
import type { PaginatedResponse } from "../dto/response.js";

export interface IChecklistHarianService {
    getAll(page: number, limit: number, query: ChecklistHarianQuery): Promise<PaginatedResponse<ChecklistHarianRes>>;
    getByID(checklistId: string): Promise<ChecklistHarianRes | null>;
    create(req: CreateChecklistHarianReq): Promise<void>;
    update(checklistId: string, req: UpdateChecklistHarianReq): Promise<void>;
    delete(checklistId: string): Promise<void>;
}