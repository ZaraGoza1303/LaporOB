import type { NotificationData, BulkNotificationData, NotifikasiGroupedResponse } from "../types/notification.js";
import type { NotifikasiWithPengirim } from "../repositories/notification_repository.interface.js";

export interface INotificationService {
    sendNotification(data: NotificationData): Promise<void>
    sendBulkNotification(data: BulkNotificationData): Promise<void>
    markAsRead(notifId: string, userId: string): Promise<void>
    markAllAsRead(userId: string): Promise<void>
    countUnread(userId: string): Promise<number>
    getAllNotifications(userId: string, role: string): Promise<NotifikasiGroupedResponse>
}
