import type { ChecklistHarianQuery, CreateChecklistHarianReq, UpdateChecklistHarianReq, ChecklistHarianRes, ChecklistHarianPageResponse, ChecklistHarianGroupedByOB } from "../dto/checklist_harian.js";
import type { IChecklistHarianRepository } from "../repositories/checklistHarian_repository.interface.js";
import { handlePrismaError } from "../utils/error.js";
import type { IChecklistHarianService } from "./checklistHarian_service.interface.js";
import type { ChecklistHarianWithRelations } from "../repositories/checklistHarian_repository.interface.js";
import type { Checklist_harianUncheckedCreateInput, Checklist_harianUncheckedUpdateInput } from "../generated/prisma/models.js";
import { CHECKLIST_STATUS, NOTIFICATION_TITLE, NOTIFICATION_TYPE, NOTIFICATION_MESSAGE } from "../utils/constants.js";
import type { BulkNotificationData, NotificationData } from "../dto/notification.js";
import type { IUsersService } from "./users_service.interface.js";
import type { INotificationService } from "./notification_service.interface.js";

export class ChecklistHarianService implements IChecklistHarianService {
    private checklistRepo: IChecklistHarianRepository;
    private usersService: IUsersService;
    private notificationService: INotificationService;

    constructor(
        checklistRepo: IChecklistHarianRepository,
        usersService: IUsersService,
        notificationService: INotificationService,
        ) {
        this.checklistRepo = checklistRepo;
        this.usersService = usersService;
        this.notificationService = notificationService;
    }

    private mapToResponse(item: ChecklistHarianWithRelations): ChecklistHarianRes {
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

    async getAll(page: number, limit: number, query: ChecklistHarianQuery): Promise<ChecklistHarianPageResponse> {
        try {
            const [
                data, 
                total, 
                done, 
                pending, 
                late
            ] = await Promise.all([
                this.checklistRepo.getAll(page, limit, query),
                this.checklistRepo.countTotalChecklist(),
                this.checklistRepo.countTotalChecklistDone(),
                this.checklistRepo.countTotalChecklistPending(),
                this.checklistRepo.countTotalChecklistLate()
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

            return {
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

    async create(userId: string, req: CreateChecklistHarianReq): Promise<void> {
        try {
            const dataToInsert: Checklist_harianUncheckedCreateInput = {
                tugas_id: req.tugas_id,
                kategori_id: req.kategori_id,
                lantai_id: req.lantai_id,
                tanggal: new Date(),
                status: CHECKLIST_STATUS.BELUM_DIKERJAKAN,
            };

            if (req.ob_id) {
                dataToInsert.ob_id = req.ob_id;

                await this.checklistRepo.insert(dataToInsert);

                const notifData: NotificationData = {
                    penerima_id: req.ob_id,
                    pengirim_id: userId,
                    tipe: NOTIFICATION_TYPE.PENUGASAN_CHECKLIST,
                    judul: NOTIFICATION_TITLE.PENUGASAN_CHECKLIST,
                    pesan: NOTIFICATION_MESSAGE.ADMIN_MENUGASKAN_OB,
                };
                await this.notificationService.sendNotification(notifData);
            } else {
                await this.checklistRepo.insert(dataToInsert);

                const allOB = await this.usersService.getByRole('ob');
                const notifData: BulkNotificationData = {
                    penerima_ids: allOB.map(ob => ob.id),
                    pengirim_id: userId,
                    tipe: NOTIFICATION_TYPE.PENUGASAN_CHECKLIST,
                    judul: NOTIFICATION_TITLE.PENUGASAN_CHECKLIST,
                    pesan: NOTIFICATION_MESSAGE.ADMIN_MENUGASKAN_OB,
                };
                await this.notificationService.sendBulkNotification(notifData);
            }
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
