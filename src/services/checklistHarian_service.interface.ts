import type { UpdateChecklistHarianReq, ChecklistHarianRes } from "../dto/checklist_harian.js";
import type { ChecklistHarianWithDetails } from "../repositories/checklistHarian_repository.interface.js";

export interface IChecklistHarianService {
    getAll(): Promise<ChecklistHarianRes[]>;
    getByID(checklistId: string): Promise<ChecklistHarianRes | null>;
    update(checklistId: string, req: UpdateChecklistHarianReq): Promise<void>;
    delete(checklistId: string): Promise<void>;

    getTodayChecklists(obId: string, tanggal: Date): Promise<ChecklistHarianWithDetails[]>;
    countTodayChecklists(obId: string, tanggal: Date): Promise<number>;
    ambilChecklist(checklistId: string, obId: string): Promise<void>;
    getCompletedByOb(): Promise<Array<{ ob_id: string; nama_tugas: string }>>;
}