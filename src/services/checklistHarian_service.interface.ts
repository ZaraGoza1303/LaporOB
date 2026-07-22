import type { UpdateChecklistHarianReq, ChecklistHarianRes } from "../dto/checklist_harian.js";
import type { ChecklistHarianWithDetails, ChecklistHarianApprovalItem } from "../repositories/checklistHarian_repository.interface.js";
import type { PaginatedResponse } from "../dto/response.js";

export interface IChecklistHarianService {
    getAll(): Promise<ChecklistHarianRes[]>;
    getAllPaginated(page: number, limit: number, search?: string): Promise<PaginatedResponse<ChecklistHarianRes>>;
    getByID(checklistId: string): Promise<ChecklistHarianRes | null>;
    update(checklistId: string, req: UpdateChecklistHarianReq): Promise<void>;
    delete(checklistId: string): Promise<void>;

    getTodayChecklists(obId: string, tanggal: Date): Promise<ChecklistHarianWithDetails[]>;
    countTodayChecklists(obId: string, tanggal: Date): Promise<number>;
    ambilChecklist(checklistId: string, obId: string): Promise<void>;
    getCompletedByOb(): Promise<Array<{ ob_id: string; nama_tugas: string }>>;
    getPendingApprovalChecklist(period: { start: Date; end: Date }, lokasiId?: string): Promise<ChecklistHarianApprovalItem[]>;
    approveChecklist(checklistId: string, adminId: string): Promise<void>;
}