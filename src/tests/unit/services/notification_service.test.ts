import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";
import { PrismaClient, Notifikasi } from "../../../generated/prisma/client";
import { NotificationRepository } from "../../../repositories/notification_repository";
import { NotificationService } from "../../../services/notification_service";
import * as websocketService from "../../../services/websocket_service";
import { AppError } from "../../../utils/error";

const mockDB = mockDeep<PrismaClient>();

const mockNotifRepo = new NotificationRepository(mockDB);
const mockNotifService = new NotificationService(mockNotifRepo);

beforeEach(() => {
    mockReset(mockDB);
    vi.restoreAllMocks();
    vi.spyOn(websocketService, 'sendToUser').mockImplementation(() => {});
});

const penerimaId = 'e2fbdc6f-ec0d-4547-a51d-a81b69741ed2';
const pengirimId = '852a6e0e-1bcf-4578-b93b-46f893544bfc';
const notifId = '3f2a1b7c-9d4e-4a51-8c6f-1d2e3f4a5b6c';

// Fungsi generate fake data dan bisa juga override
function createFakeNotif(overrides?: Partial<Notifikasi>): Notifikasi {
    return {
        id: notifId,
        penerima_id: penerimaId,
        pengirim_id: pengirimId,
        tipe: 'LAPORAN_BARU',
        judul: 'Laporan baru',
        pesan: 'Ada laporan baru',
        is_read: false,
        read_at: null,
        ref_id: null,
        ref_tipe: null,
        created_at: new Date('2026-01-01T00:00:00Z'),
        ...overrides,
    };
}

describe('NotificationService.sendNotification', () => {
    it('menyimpan notifikasi dan mengirim via websocket', async () => {
        const fakeNotif = createFakeNotif();
        mockDB.notifikasi.create.mockResolvedValue(fakeNotif);

        await mockNotifService.sendNotification({
            penerima_id: penerimaId,
            pengirim_id: pengirimId,
            tipe: 'LAPORAN_BARU',
            judul: 'Laporan baru',
            pesan: 'Ada laporan baru',
            ref_tipe: 'LAPORAN',
        });

        expect(mockDB.notifikasi.create).toHaveBeenCalledWith({
            data: expect.objectContaining({ tipe: 'LAPORAN_BARU', judul: 'Laporan baru' }),
        });
        expect(websocketService.sendToUser).toHaveBeenCalledWith(penerimaId, fakeNotif);
    });

    it('tidak mengirim pesan dan ref jika tidak diisi', async () => {
        const fakeNotif = createFakeNotif({ pesan: null });
        mockDB.notifikasi.create.mockResolvedValue(fakeNotif);

        await mockNotifService.sendNotification({
            penerima_id: penerimaId,
            pengirim_id: pengirimId,
            tipe: 'LAPORAN_BARU',
            judul: 'Laporan baru',
        });

        expect(mockDB.notifikasi.create).toHaveBeenCalledWith({
            data: expect.not.objectContaining({ pesan: expect.anything() }),
        });
    });
});

describe('NotificationService.sendBulkNotification', () => {
    it('menyimpan banyak notifikasi dan mengirim semuanya via websocket', async () => {
        const fakeNotifs = [createFakeNotif(), createFakeNotif({ id: 'lain' })];
        mockDB.$transaction.mockResolvedValue(fakeNotifs as never);

        await mockNotifService.sendBulkNotification({
            penerima_ids: [penerimaId, 'ob-lain'],
            pengirim_id: pengirimId,
            tipe: 'SKILL_DI_PEROLEH',
            judul: 'Skill baru diperoleh',
            pesan: 'Selamat!',
            ref_tipe: 'SKILL',
        });

        expect(mockDB.$transaction).toHaveBeenCalledTimes(1);
        expect(websocketService.sendToUser).toHaveBeenCalledTimes(2);
    });
});

describe('NotificationService.markAsRead', () => {
    it('menandai notifikasi sudah dibaca jika milik user', async () => {
        mockDB.notifikasi.findFirst.mockResolvedValue({
            ...createFakeNotif(),
            pengirim: { id: pengirimId, nama_lengkap: 'Admin' },
        } as never);
        mockDB.notifikasi.update.mockResolvedValue(createFakeNotif({ is_read: true }));

        await mockNotifService.markAsRead(notifId, penerimaId);

        expect(mockDB.notifikasi.update).toHaveBeenCalledWith({
            where: { id: notifId },
            data: { is_read: true, read_at: expect.any(Date) },
        });
    });

    it('melempar AppError 404 jika notifikasi tidak ditemukan', async () => {
        mockDB.notifikasi.findFirst.mockResolvedValue(null);

        await expect(mockNotifService.markAsRead(notifId, penerimaId)).rejects.toThrow(
            new AppError('Notifikasi tidak ditemukan', 404)
        );
    });

    it('melempar AppError 403 jika bukan milik user', async () => {
        mockDB.notifikasi.findFirst.mockResolvedValue({
            ...createFakeNotif({ penerima_id: 'user-lain' }),
            pengirim: { id: pengirimId, nama_lengkap: 'Admin' },
        } as never);

        await expect(mockNotifService.markAsRead(notifId, penerimaId)).rejects.toThrow(
            new AppError('Anda tidak memiliki akses ke notifikasi ini', 403)
        );
    });
});

describe('NotificationService.countUnread', () => {
    it('mengembalikan jumlah notifikasi belum dibaca', async () => {
        mockDB.notifikasi.count.mockResolvedValue(3);

        const data = await mockNotifService.countUnread(penerimaId);

        expect(data).toBe(3);
    });
});

describe('NotificationService.getAllNotifications', () => {
    it('mengembalikan notifikasi admin berdasarkan tipe untuk role admin', async () => {
        mockDB.notifikasi.findMany.mockResolvedValue([]);

        const data = await mockNotifService.getAllNotifications(penerimaId, 'admin');

        expect(mockDB.notifikasi.findMany).toHaveBeenCalledTimes(2);
        expect(data).toEqual({ hari_ini: [], kemarin: [] });
    });

    it('mengembalikan notifikasi milik user untuk role ob', async () => {
        mockDB.notifikasi.findMany.mockResolvedValue([]);

        const data = await mockNotifService.getAllNotifications(penerimaId, 'ob');

        expect(mockDB.notifikasi.findMany).toHaveBeenCalledTimes(2);
        expect(data).toEqual({ hari_ini: [], kemarin: [] });
    });
});
