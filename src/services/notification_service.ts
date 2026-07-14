import type { NotificationData, BulkNotificationData, NotifikasiGroupedResponse } from "../dto/notification.js";
import type { NotifikasiCreateInput } from "../generated/prisma/models.js";
import type { INotificationRepository } from "../repositories/notification_repository.interface.js";
import { USER_ROLE } from "../utils/constants.js";
import { handlePrismaError } from "../utils/error.js";
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
        }));

        const notifications = await this.notifRepo.insertMany(notifReqs);
        notifications.forEach(notif => sendToUser(notif.penerima_id, notif));
    }

    async markAsRead(notifId: string): Promise<void> {
        try {
            await this.notifRepo.markAsRead(notifId);
        } catch (err) {
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

            const fetchToday = role === USER_ROLE.ADMIN
            ? this.notifRepo.getAllByDateRange(startOfToday, startOfYesterday)
            : this.notifRepo.getByUserAndDateRange(userId, startOfToday, now)

            const fetchYesterday = role === USER_ROLE.ADMIN
            ? this.notifRepo.getAllByDateRange(startOfToday, startOfYesterday)
            : this.notifRepo.getByUserAndDateRange(userId, startOfToday, now)

            const [hariIni, kemarin] = await Promise.all([fetchToday, fetchYesterday]);

            return { hari_ini: hariIni, kemarin };
        } catch (err) {
            handlePrismaError(err);
        }
    }
}
