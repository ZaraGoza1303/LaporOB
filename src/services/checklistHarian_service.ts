import type { ChecklistHarianQuery, CreateChecklistHarianReq, UpdateChecklistHarianReq, ChecklistHarianRes } from "../dto/checklist_harian.js";
import type { PaginatedResponse } from "../dto/response.js";
import type { IChecklistHarianRepository } from "../repositories/checklistHarian_repository.interface.js";
import { handlePrismaError } from "../utils/error.js";
import type { IChecklistHarianService } from "./checklistHarian_service.interface.js";
import type { Checklist_harianUncheckedCreateInput, Checklist_harianUncheckedUpdateInput } from "../generated/prisma/models.js";
import { CHECKLIST_STATUS } from "../utils/constants.js";

export class ChecklistHarianService implements IChecklistHarianService {
    private checklistRepo: IChecklistHarianRepository;

    constructor(checklistRepo: IChecklistHarianRepository) {
        this.checklistRepo = checklistRepo;
    }

    private mapToResponse(item: any): ChecklistHarianRes {
        return {
            id: item.id,
            tugas_id: item.tugas_id,
            kategori_id: item.kategori_id,
            lantai_id: item.lantai_id,
            ob_id: item.ob_id,
            status: item.status,
            catatan: item.catatan,
            created_at: item.created_at,
            updated_at: item.updated_at,
            tugas: item.tugas,
            kategori: item.kategori,
            lantai: item.lantai,
            ob: item.ob,
        };
    }

    async getAll(page: number, limit: number, query: ChecklistHarianQuery): Promise<PaginatedResponse<ChecklistHarianRes>> {
        try {
            const data = await this.checklistRepo.getAll(page, limit, query);
            return {
                ...data,
                items: data.items.map(this.mapToResponse)
            };
        } catch (err) {
            handlePrismaError(err);
        }
    }

    async getByID(checklistId: string): Promise<ChecklistHarianRes | null> {
        try {
            const item = await this.checklistRepo.getByID(checklistId);
            if (!item) return null;
            return this.mapToResponse(item);
        } catch (err) {
            handlePrismaError(err);
        }
    }

    async create(req: CreateChecklistHarianReq): Promise<void> {
        try {
            const dataToInsert: Checklist_harianUncheckedCreateInput = {
                tugas_id: req.tugas_id,
                kategori_id: req.kategori_id,
                lantai_id: req.lantai_id,
                tanggal: new Date(req.tanggal),
                status: CHECKLIST_STATUS.BELUM_DIKERJAKAN,
            };
            await this.checklistRepo.insert(dataToInsert);
        } catch (err) {
            handlePrismaError(err);
        }
    }

    async update(checklistId: string, req: UpdateChecklistHarianReq): Promise<void> {
        try {
            const dataToUpdate: Checklist_harianUncheckedUpdateInput = {};
            if (req.tugas_id !== undefined) dataToUpdate.tugas_id = req.tugas_id;
            if (req.kategori_id !== undefined) dataToUpdate.kategori_id = req.kategori_id;
            if (req.lantai_id !== undefined) dataToUpdate.lantai_id = req.lantai_id;
            if (req.status !== undefined) dataToUpdate.status = req.status;

            if (req.ob_id !== undefined) dataToUpdate.ob_id = req.ob_id ?? null;
            if (req.catatan !== undefined) dataToUpdate.catatan = req.catatan ?? null;

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
}
