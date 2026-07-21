import type { UpdateChecklistHarianReq, ChecklistHarianRes } from "../dto/checklist_harian.js";
import type { IChecklistHarianRepository } from "../repositories/checklistHarian_repository.interface.js";
import { handlePrismaError } from "../utils/error.js";
import type { IChecklistHarianService } from "./checklistHarian_service.interface.js";
import type { ChecklistHarianWithRelations, ChecklistHarianWithDetails } from "../repositories/checklistHarian_repository.interface.js";
import type { Checklist_harianUncheckedUpdateInput } from "../generated/prisma/models.js";
import { CHECKLIST_STATUS } from "../utils/constants.js";

export class ChecklistHarianService implements IChecklistHarianService {
    private checklistRepo: IChecklistHarianRepository;

    constructor(
        checklistRepo: IChecklistHarianRepository,
    ) {
        this.checklistRepo = checklistRepo;
    }

    async getAll(): Promise<ChecklistHarianRes[]> {
        try {
            const items = await this.checklistRepo.getAll();
            const result = items.map(item => this.mapToResponse(item));
            return result;
        } catch (err) {
            handlePrismaError(err);
        }
    }

    async getByID(checklistId: string): Promise<ChecklistHarianRes | null> {
        try {
            const item = await this.checklistRepo.getByID(checklistId);
            if (!item) return null;
            const result = this.mapToResponse(item);
            return result;
        } catch (err) {
            handlePrismaError(err);
        }
    }

    async update(checklistId: string, req: UpdateChecklistHarianReq): Promise<void> {
        try {
            const dataToUpdate: Checklist_harianUncheckedUpdateInput = {};
            if (req.nama_tugas !== undefined) dataToUpdate.nama_tugas = req.nama_tugas;
            if (req.kategori_id !== undefined) dataToUpdate.kategori_id = req.kategori_id;
            if (req.lantai_id !== undefined) dataToUpdate.lantai_id = req.lantai_id;
            if (req.ob_id !== undefined) dataToUpdate.ob_id = req.ob_id ?? null;
            if (req.catatan !== undefined) dataToUpdate.catatan = req.catatan ?? null;

            if (req.status !== undefined) {
                dataToUpdate.status = req.status;
                const now = new Date();
                if (req.status === CHECKLIST_STATUS.SEDANG_DIKERJAKAN) {
                    dataToUpdate.dikerjakan_at = now;
                } else if (req.status === CHECKLIST_STATUS.SELESAI) {
                    dataToUpdate.selesai_at = now;
                } else if (req.status === CHECKLIST_STATUS.TERLEWAT) {
                    dataToUpdate.terlewat_at = now;
                }
            }

            await this.checklistRepo.update(checklistId, dataToUpdate);
        } catch (err) {
            handlePrismaError(err);
        }
    }

    async delete(checklistId: string): Promise<void> {
        try {
            await this.checklistRepo.delete(checklistId);
        } catch (err) {
            handlePrismaError(err);
        }
    }

    async getTodayChecklists(obId: string, tanggal: Date): Promise<ChecklistHarianWithDetails[]> {
        const result = await this.checklistRepo.getTodayChecklists(obId, tanggal);
        return result;
    }

    async countTodayChecklists(obId: string, tanggal: Date): Promise<number> {
        const result = await this.checklistRepo.countTodayChecklists(obId, tanggal);
        return result;
    }

    async ambilChecklist(checklistId: string, obId: string): Promise<void> {
        await this.checklistRepo.ambilChecklist(checklistId, obId);
    }

    async getCompletedByOb(): Promise<Array<{ ob_id: string; nama_tugas: string }>> {
        return this.checklistRepo.getCompletedChecklistByOb();
    }

    private mapToResponse(item: ChecklistHarianWithRelations): ChecklistHarianRes {
        const response: ChecklistHarianRes = {
            id: item.id,
            nama_tugas: item.nama_tugas,
            kategori_id: item.kategori_id,
            lantai_id: item.lantai_id,
            ob_id: item.ob_id,
            status: item.status,
            catatan: item.catatan,
            dikerjakan_at: item.dikerjakan_at ?? null,
            selesai_at: item.selesai_at ?? null,
            terlewat_at: item.terlewat_at ?? null,
            tanggal: item.tanggal,
            created_at: item.created_at,
            updated_at: item.updated_at,
            kategori: item.kategori,
            lantai: item.lantai,
            ob: item.ob,
        };
        return response;
    }
}
