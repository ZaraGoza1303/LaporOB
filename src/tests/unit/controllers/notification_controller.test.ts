import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";
import type { Request, Response } from "express";
import { NotificationController } from "../../../controllers/notification_controller";
import type { INotificationService } from "../../../services/notification_service.interface";
import { AppError } from "../../../utils/error";

const mockNotificationService = mockDeep<INotificationService>();

const notificationController = new NotificationController(mockNotificationService);

beforeEach(() => {
    mockReset(mockNotificationService);
});

const notifId = '3f2a1b7c-9d4e-4a51-8c6f-1d2e3f4a5b6c';
const userId = 'e2fbdc6f-ec0d-4547-a51d-a81b69741ed2';

// Fake req/res express.
function createFakeReq(overrides?: {
    params?: Record<string, string>;
    user?: { id: string; username: string; role: string };
}) {
    return { params: {}, ...overrides } as unknown as Request;
}

function createSuccessfullRes(data?: unknown) {
    return {
        success: true,
        message: expect.any(String),
        data: data,
    }
}

function createFailedRes() {
    return {
        errors: undefined,
        success: false,
        message: expect.any(String),
    }
}

function createFakeRes() {
    return {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
    } as unknown as Response;
}

function createUserReq(params?: Record<string, string>) {
    return createFakeReq({ params, user: { id: userId, username: 'farhan', role: 'ob' } });
}

describe('NotificationController.markAsRead', () => {
    it('mengembalikan response 200 setelah menandai dibaca', async () => {
        mockNotificationService.markAsRead.mockResolvedValue(undefined);

        const res = createFakeRes();
        await notificationController.markAsRead(createUserReq({ notification_id: notifId }), res);

        expect(mockNotificationService.markAsRead).toHaveBeenCalledWith(notifId, userId);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(createSuccessfullRes());
    });

    it('mengembalikan 400 dan tidak memanggil service jika id bukan uuid', async () => {
        const res = createFakeRes();
        await notificationController.markAsRead(createUserReq({ notification_id: 'bukan-uuid' }), res);

        expect(mockNotificationService.markAsRead).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('meneruskan status code AppError dari service', async () => {
        mockNotificationService.markAsRead.mockRejectedValue(new AppError('Notifikasi tidak ditemukan', 404));

        const res = createFakeRes();
        await notificationController.markAsRead(createUserReq({ notification_id: notifId }), res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });

    it('mengembalikan 500 jika terjadi error yang tidak terduga', async () => {
        mockNotificationService.markAsRead.mockRejectedValue(new Error('boom'));

        const res = createFakeRes();
        await notificationController.markAsRead(createUserReq({ notification_id: notifId }), res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(createFailedRes());
    });
});

describe('NotificationController.markAllAsRead', () => {
    it('mengembalikan response 200 setelah menandai semua dibaca', async () => {
        mockNotificationService.markAllAsRead.mockResolvedValue(undefined);

        const res = createFakeRes();
        await notificationController.markAllAsRead(createUserReq(), res);

        expect(mockNotificationService.markAllAsRead).toHaveBeenCalledWith(userId);
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('mengembalikan 500 jika terjadi error yang tidak terduga', async () => {
        mockNotificationService.markAllAsRead.mockRejectedValue(new Error('boom'));

        const res = createFakeRes();
        await notificationController.markAllAsRead(createUserReq(), res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('NotificationController.countUnread', () => {
    it('mengembalikan jumlah belum dibaca dengan response 200', async () => {
        mockNotificationService.countUnread.mockResolvedValue(3);

        const res = createFakeRes();
        await notificationController.countUnread(createUserReq(), res);

        expect(mockNotificationService.countUnread).toHaveBeenCalledWith(userId);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(createSuccessfullRes(3));
    });

    it('mengembalikan 500 jika terjadi error yang tidak terduga', async () => {
        mockNotificationService.countUnread.mockRejectedValue(new Error('boom'));

        const res = createFakeRes();
        await notificationController.countUnread(createUserReq(), res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('NotificationController.getAllNotifications', () => {
    it('mengembalikan notifikasi user dengan response 200', async () => {
        const fakeData = { hari_ini: [], kemarin: [] };
        mockNotificationService.getAllNotifications.mockResolvedValue(fakeData as never);

        const res = createFakeRes();
        await notificationController.getAllNotifications(createUserReq(), res);

        expect(mockNotificationService.getAllNotifications).toHaveBeenCalledWith(userId, 'ob');
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(createSuccessfullRes(fakeData));
    });

    it('mengembalikan 500 jika terjadi error yang tidak terduga', async () => {
        mockNotificationService.getAllNotifications.mockRejectedValue(new Error('boom'));

        const res = createFakeRes();
        await notificationController.getAllNotifications(createUserReq(), res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});
