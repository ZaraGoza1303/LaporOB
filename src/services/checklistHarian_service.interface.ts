import type { ChecklistHarianQuery, UpdateChecklistHarianReq, ChecklistHarianRes, ChecklistHarianPageResponse } from "../dto/checklist_harian.js";
import type { ChecklistHarianWithDetails } from "../repositories/checklistHarian_repository.interface.js";

export interface IChecklistHarianService {
    getAll(page: number, limit: number, query: ChecklistHarianQuery): Promise<ChecklistHarianPageResponse>;
    getByID(checklistId: string): Promise<ChecklistHarianRes | null>;
    update(checklistId: string, req: UpdateChecklistHarianReq): Promise<void>;
    delete(checklistId: string): Promise<void>;

    getTodayChecklists(obId: string, tanggal: Date): Promise<ChecklistHarianWithDetails[]>;
    countTodayChecklists(obId: string, tanggal: Date): Promise<number>;
    ambilChecklist(checklistId: string, obId: string): Promise<void>;
}