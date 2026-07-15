import type { INotificationService } from "../services/notification_service.interface.js";
import type { Request, Response } from "express";
import { sendErrorResponse, sendSuccessfullResponse } from "../utils/response.js";
import { AppError } from "../utils/error.js";
import { NotificationIdSchema } from "../dto/notification.js";
export class NotificationController {
    private notificationService: INotificationService;

    constructor(notificationService: INotificationService) {
        this.notificationService = notificationService;
    }

    async markAsRead(req: Request, res: Response) {
        try {
            const validateParams = NotificationIdSchema.safeParse(req.params);
            if (!validateParams.success) {
                const formattedErr = validateParams.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr));
            }

            const notifId = validateParams.data.notification_id;
            await this.notificationService.markAsRead(notifId);

            return res.status(200).json(sendSuccessfullResponse("Notifikasi berhasil dibaca"));
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Terjadi kesalahan, tidak berhasil membaca notifikasi"))
        }
    }

    async markAllAsRead(req: Request, res: Response) {
        try {
            const userId = req.user?.id as string;
            await this.notificationService.markAllAsRead(userId);

            return res.status(200).json(sendSuccessfullResponse("Semua notifikasi berhasil dibaca"));
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Terjadi kesalahan, tidak berhasil membaca notifikasi"))
        }  
    }

    async countUnread(req: Request, res: Response){
        try {
            const userId = req.user?.id as string;
            const data = await this.notificationService.countUnread(userId);

            return res.status(200).json(sendSuccessfullResponse("Berhasil mendapatkan total pesan yang belum diibaca", data));
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Terjadi kesalahan, tidak berhasil membaca notifikasi"))
        }          
    }

    async getAllNotifications(req: Request, res: Response) {
        try {
            const userId = req.user?.id as string;
            const userRole = req.user?.role as string;

            const data = await this.notificationService.getAllNotifications(userId, userRole);

            return res.status(200).json(sendSuccessfullResponse("Berhasil mendapatkan notifikasi", data));
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Terjadi kesalahan, tidak berhasil mendapatkan notifikasi"))
        }
    }
}