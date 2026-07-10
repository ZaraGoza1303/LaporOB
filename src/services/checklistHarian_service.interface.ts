import type { ChecklistHarianQuery, CreateChecklistHarianReq, UpdateChecklistHarianReq, ChecklistHarianRes, ChecklistHarianPageResponse } from "../dto/checklist_harian.js";

export interface IChecklistHarianService {
    getAll(page: number, limit: number, query: ChecklistHarianQuery): Promise<ChecklistHarianPageResponse>;
    getByID(checklistId: string): Promise<ChecklistHarianRes | null>;
    create(req: CreateChecklistHarianReq): Promise<void>;
    update(checklistId: string, req: UpdateChecklistHarianReq): Promise<void>;
    delete(checklistId: string): Promise<void>;
}