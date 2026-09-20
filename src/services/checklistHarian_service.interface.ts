import type { UpdateChecklistHarianReq } from "../dto/checklist_harian.js";
import type { ChecklistHarianRes } from "../types/checklist_harian.js";
import type { ChecklistHarianWithDetails, ChecklistHarianApprovalItem } from "../repositories/checklistHarian_repository.interface.js";
import type { PaginatedResponse } from "../types/response.js";
import type { Checklist_harianUncheckedCreateInput } from "../generated/prisma/models.js";

export interface IChecklistHarianService {
    getAll(obId?: string): Promise<ChecklistHarianRes[]>;
    getAllPaginated(page: number, limit: number, search?: string): Promise<PaginatedResponse<ChecklistHarianRes>>;
    getByID(checklistId: string, obId?: string): Promise<ChecklistHarianRes | null>;
    update(checklistId: string, req: UpdateChecklistHarianReq): Promise<void>;
    delete(checklistId: string): Promise<void>;

    getTodayChecklists(obId: string, tanggal: Date): Promise<ChecklistHarianWithDetails[]>;
    countTodayChecklists(obId: string, tanggal: Date): Promise<number>;
    ambilChecklist(checklistId: string, obId: string): Promise<void>;
    getCompletedByOb(): Promise<Array<{ ob_id: string; nama_tugas: string }>>;
    getPendingApprovalChecklist(period: { start: Date; end: Date }, lokasiId?: string): Promise<ChecklistHarianApprovalItem[]>;
    approveChecklist(checklistId: string): Promise<void>;
    insertMany(data: Checklist_harianUncheckedCreateInput[]): Promise<number>;
}
