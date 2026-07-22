import { Prisma } from "../generated/prisma/client.js";
import type { Checklist_harianUncheckedCreateInput, Checklist_harianUncheckedUpdateInput } from "../generated/prisma/models.js";
import type { JadwalChecklist } from "../generated/prisma/client.js";
import type { PaginatedResponse } from "../dto/response.js";

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

export type ChecklistHarianApprovalItem = Prisma.Checklist_harianGetPayload<{
    include: {
        ob: { select: { id: true; nama_lengkap: true } };
        lantai: { include: { lokasi: { select: { nama_lokasi: true } } } };
        kategori: { select: { id: true; nama_kategori: true } };
    };
}>;

export interface IChecklistHarianRepository {
    getAll(): Promise<ChecklistHarianWithRelations[]>;
    getAllPaginated(page: number, limit: number, search?: string): Promise<PaginatedResponse<ChecklistHarianWithRelations>>;
    getByID(checklist_harianId: string): Promise<ChecklistHarianWithRelations | null>
    insert(req: Checklist_harianUncheckedCreateInput): Promise<void>;
    update(checklist_harianId: string, req: Checklist_harianUncheckedUpdateInput): Promise<void>;
    delete(checklist_harianId: string): Promise<void>;

    insertMany(data: Checklist_harianUncheckedCreateInput[]): Promise<void>;

    insertFromJadwal(jadwal: JadwalChecklist): Promise<void>;
    getExistingInstanceKeys(today: Date): Promise<Array<{ nama_tugas: string; lantai_id: string; ob_id: string | null }>>;

    getTodayChecklists(obId: string, tanggal: Date): Promise<ChecklistHarianWithDetails[]>;
    countTodayChecklists(obId: string, tanggal: Date): Promise<number>;
    ambilChecklist(checklistId: string, obId: string): Promise<void>;

    getCompletedChecklistByOb(): Promise<Array<{ ob_id: string; nama_tugas: string }>>;
    getPendingApproval(period: { start: Date; end: Date }, lokasiId?: string): Promise<ChecklistHarianApprovalItem[]>;
    approve(checklistId: string, adminId: string): Promise<void>;
}
