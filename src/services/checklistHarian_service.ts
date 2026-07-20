import type { ChecklistHarianQuery, CreateChecklistHarianReq, UpdateChecklistHarianReq, ChecklistHarianRes, ChecklistHarianPageResponse, ChecklistHarianGroupedByOB } from "../dto/checklist_harian.js";
import type { IChecklistHarianRepository } from "../repositories/checklistHarian_repository.interface.js";
import { handlePrismaError } from "../utils/error.js";
import type { IChecklistHarianService } from "./checklistHarian_service.interface.js";
import type { ChecklistHarianWithRelations, ChecklistHarianWithDetails } from "../repositories/checklistHarian_repository.interface.js";
import type { Checklist_harianUncheckedCreateInput, Checklist_harianUncheckedUpdateInput } from "../generated/prisma/models.js";
import { CHECKLIST_STATUS, NOTIFICATION_TITLE, NOTIFICATION_TYPE, NOTIFICATION_MESSAGE, REF_TIPE, USER_ROLE } from "../utils/constants.js";
import type { BulkNotificationData } from "../dto/notification.js";
import type { INotificationService } from "./notification_service.interface.js";
import type { IUsersService } from "./users_service.interface.js";
import { calculatePeriodRange } from "../utils/date.js";

export class ChecklistHarianService implements IChecklistHarianService {
    private checklistRepo: IChecklistHarianRepository;
    private notificationService: INotificationService;
    private usersService: IUsersService;

    constructor(
        checklistRepo: IChecklistHarianRepository,
        notificationService: INotificationService,
        usersService: IUsersService,
    ) {
        this.checklistRepo = checklistRepo;
        this.notificationService = notificationService;
        this.usersService = usersService;
    }

    async getAll(page: number, limit: number, query: ChecklistHarianQuery): Promise<ChecklistHarianPageResponse> {
        try {
            const dateRange = calculatePeriodRange(query.period);

            const [
                data,
                total,
                done,
                pending,
                late
            ] = await Promise.all([
                this.checklistRepo.getAll(page, limit, query),
                this.checklistRepo.countTotalChecklist(dateRange),
                this.checklistRepo.countTotalChecklistDone(dateRange),
                this.checklistRepo.countTotalChecklistPending(dateRange),
                this.checklistRepo.countTotalChecklistLate(dateRange)
            ]);

            const mappedItems = data.items.map(item => this.mapToResponse(item));
            const groupedMap = new Map<string | null, ChecklistHarianGroupedByOB>();

            for (const item of mappedItems) {
                const key = item.ob_id || null;
                if (!groupedMap.has(key)) {
                    groupedMap.set(key, {
                        ob_id: key,
                        ob: item.ob || null,
                        items: []
                    });
                }
                groupedMap.get(key)!.items.push(item);
            }

            const groupedItems = Array.from(groupedMap.values());

            const result: ChecklistHarianPageResponse = {
                checklist: {
                    ...data,
                    items: groupedItems
                },
                counts: {
                    total,
                    done,
                    pending,
                    late
                }
            };
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

    async create(userId: string, req: CreateChecklistHarianReq): Promise<void> {
        try {
            const dataToInsert: Checklist_harianUncheckedCreateInput = {
                nama_tugas: req.nama_tugas,
                kategori_id: req.kategori_id,
                lantai_id: req.lantai_id,
                tanggal: new Date(),
                status: CHECKLIST_STATUS.BELUM_DIKERJAKAN,
                ob_id: null,
            };

            await this.checklistRepo.insert(dataToInsert);

            const allOb = await this.usersService.getByRole(USER_ROLE.OB);
            const notifData: BulkNotificationData = {
                penerima_ids: allOb.map(ob => ob.id),
                pengirim_id: userId,
                tipe: NOTIFICATION_TYPE.PENUGASAN_CHECKLIST,
                judul: NOTIFICATION_TITLE.PENUGASAN_CHECKLIST,
                pesan: NOTIFICATION_MESSAGE.ADMIN_MENUGASKAN_OB,
                ref_tipe: REF_TIPE.CHECKLIST,
            };

            await this.notificationService.sendBulkNotification(notifData);
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
