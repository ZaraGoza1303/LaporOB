import type { NotificationData, BulkNotificationData, NotifikasiGroupedResponse } from "../dto/notification.js";
import type { NotifikasiCreateInput } from "../generated/prisma/models.js";
import type { INotificationRepository } from "../repositories/notification_repository.interface.js";
import { USER_ROLE, NOTIFICATION_TYPE } from "../utils/constants.js";
import { handlePrismaError, AppError } from "../utils/error.js";
import type { INotificationService } from "./notification_service.interface.js";
import { sendToUser } from "./websocket_service.js";

export class NotificationService implements INotificationService {
    private notifRepo: INotificationRepository

    constructor(notifRepo: INotificationRepository) {
        this.notifRepo = notifRepo;
    }

    async sendNotification(data: NotificationData): Promise<void> {
        const notifReq: NotifikasiCreateInput = {
            penerima: {
                connect: {id: data.penerima_id}
            },
            pengirim: {
                connect: {id: data.pengirim_id}
            },
            tipe: data.tipe,
            judul: data.judul,
        }

        if (data.pesan !== undefined) notifReq.pesan = data.pesan;
        if (data.ref_id !== undefined && data.ref_id !== null) notifReq.ref_id = data.ref_id;
        if (data.ref_tipe !== undefined && data.ref_tipe !== null) notifReq.ref_tipe = data.ref_tipe;

        const notification = await this.notifRepo.insert(notifReq);
        sendToUser(data.penerima_id, notification);
    }

    async sendBulkNotification(data: BulkNotificationData): Promise<void> {
        const notifReqs: NotifikasiCreateInput[] = data.penerima_ids.map(penerima_id => ({
            penerima: {
                connect: { id: penerima_id }
            },
            pengirim: {
                connect: { id: data.pengirim_id }
            },
            tipe: data.tipe,
            judul: data.judul,
            ...(data.pesan !== undefined && { pesan: data.pesan }),
            ...(data.ref_id !== undefined && data.ref_id !== null && { ref_id: data.ref_id }),
            ...(data.ref_tipe !== undefined && data.ref_tipe !== null && { ref_tipe: data.ref_tipe }),
        }));

        const notifications = await this.notifRepo.insertMany(notifReqs);
        notifications.forEach(notif => sendToUser(notif.penerima_id, notif));
    }

    async markAsRead(notifId: string, userId: string): Promise<void> {
        try {
            const notif = await this.notifRepo.getById(notifId);
            if (!notif) {
                throw new AppError("Notifikasi tidak ditemukan", 404);
            }
            if (notif.penerima_id !== userId) {
                throw new AppError("Anda tidak memiliki akses ke notifikasi ini", 403);
            }
            await this.notifRepo.markAsRead(notifId);
        } catch (err) {
            if (err instanceof AppError) throw err;
            handlePrismaError(err)
        }
    }

    async markAllAsRead(userId: string): Promise<void> {
        try {
            await this.notifRepo.markAllAsRead(userId);
        } catch (err) {
            handlePrismaError(err)
        }
    }

    async countUnread(userId: string): Promise<number> {
        try {
            return await this.notifRepo.countUnread(userId);
        } catch (err) {
            handlePrismaError(err)
        }
    }

    async getAllNotifications(userId: string, role: string): Promise<NotifikasiGroupedResponse> {
        try {
            const now = new Date();

            const startOfToday = new Date(now);
            startOfToday.setHours(0, 0, 0, 0);

            const startOfYesterday = new Date(startOfToday);
            startOfYesterday.setDate(startOfYesterday.getDate() - 1);

            if (role === USER_ROLE.ADMIN) {
                const adminTypes = [NOTIFICATION_TYPE.LAPORAN_BARU, NOTIFICATION_TYPE.PENUGASAN_CHECKLIST];
                const [hariIni, kemarin] = await Promise.all([
                    this.notifRepo.getByTypesAndDateRange(adminTypes, startOfToday, now),
                    this.notifRepo.getByTypesAndDateRange(adminTypes, startOfYesterday, startOfToday),
                ]);
                const result: NotifikasiGroupedResponse = { hari_ini: hariIni, kemarin };
                return result;
            }

            const [hariIni, kemarin] = await Promise.all([
                this.notifRepo.getByUserAndDateRange(userId, startOfToday, now),
                this.notifRepo.getByUserAndDateRange(userId, startOfYesterday, startOfToday),
            ]);

            const result: NotifikasiGroupedResponse = { hari_ini: hariIni, kemarin };
            return result;
        } catch (err) {
            handlePrismaError(err);
        }
    }
}
