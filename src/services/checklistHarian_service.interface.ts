import type { UpdateChecklistHarianReq } from "../dto/checklist_harian.js";
import type { ChecklistHarianRes } from "../types/checklist_harian.js";
import type { ChecklistHarianWithDetails, ChecklistHarianApprovalItem } from "../repositories/checklistHarian_repository.interface.js";
import type { PaginatedResponse } from "../types/response.js";
import type { JadwalChecklist } from "../generated/prisma/client.js";

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
    approveChecklist(checklistId: string, adminId: string): Promise<void>;
    getExistingInstanceKeys(today: Date): Promise<Array<{ nama_tugas: string; lantai_id: string; ob_id: string | null }>>;
    insertFromJadwal(jadwal: JadwalChecklist): Promise<void>;
}