import { beforeEach, describe, expect, it } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';
import { PrismaClient, Notifikasi } from '../../../generated/prisma/client.js';
import { NotificationRepository } from '../../../repositories/notification_repository.js';

const mockDB = mockDeep<PrismaClient>();
const mockNotifRepo = new NotificationRepository(mockDB);

beforeEach(() => {
    mockReset(mockDB);
});

const notifId = '3f2a1b7c-9d4e-4a51-8c6f-1d2e3f4a5b6c';
const userId = 'e2fbdc6f-ec0d-4547-a51d-a81b69741ed2';

// Fungsi generate fake data dan bisa juga override
function createFakeNotif(overrides?: Partial<Notifikasi>): Notifikasi {
    return {
        id: notifId,
        penerima_id: userId,
        pengirim_id: '852a6e0e-1bcf-4578-b93b-46f893544bfc',
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

describe('NotificationRepository.insert', () => {
    it('membuat notifikasi baru dan mengembalikannya', async () => {
        const fakeNotif = createFakeNotif();
        const req = { penerima: { connect: { id: userId } }, tipe: 'LAPORAN_BARU', judul: 'Laporan baru' } as never;
        mockDB.notifikasi.create.mockResolvedValue(fakeNotif);

        const data = await mockNotifRepo.insert(req);

        expect(mockDB.notifikasi.create).toHaveBeenCalledWith({ data: req });
        expect(data).toEqual(fakeNotif);
    });
});

describe('NotificationRepository.getById', () => {
    it('mengembalikan notifikasi beserta pengirim', async () => {
        const fakeNotif = { ...createFakeNotif(), pengirim: { id: 'admin-1', nama_lengkap: 'Admin' } };
        mockDB.notifikasi.findFirst.mockResolvedValue(fakeNotif as never);

        const data = await mockNotifRepo.getById(notifId);

        expect(mockDB.notifikasi.findFirst).toHaveBeenCalledWith({
            where: { id: notifId },
            include: { pengirim: { select: { id: true, nama_lengkap: true } } },
        });
        expect(data).toEqual(fakeNotif);
    });

    it('mengembalikan null jika notifikasi tidak ditemukan', async () => {
        mockDB.notifikasi.findFirst.mockResolvedValue(null);

        const data = await mockNotifRepo.getById('not-exist');

        expect(data).toBeNull();
    });
});

describe('NotificationRepository.markAsRead', () => {
    it('menandai notifikasi sudah dibaca', async () => {
        mockDB.notifikasi.update.mockResolvedValue(createFakeNotif({ is_read: true }));

        await mockNotifRepo.markAsRead(notifId);

        expect(mockDB.notifikasi.update).toHaveBeenCalledWith({
            where: { id: notifId },
            data: { is_read: true, read_at: expect.any(Date) },
        });
    });
});

describe('NotificationRepository.markAllAsRead', () => {
    it('menandai semua notifikasi milik user sudah dibaca', async () => {
        mockDB.notifikasi.updateMany.mockResolvedValue({ count: 3 });

        await mockNotifRepo.markAllAsRead(userId);

        expect(mockDB.notifikasi.updateMany).toHaveBeenCalledWith({
            where: { penerima_id: userId, is_read: false },
            data: { is_read: true, read_at: expect.any(Date) },
        });
    });
});

describe('NotificationRepository.countUnread', () => {
    it('menghitung notifikasi yang belum dibaca', async () => {
        mockDB.notifikasi.count.mockResolvedValue(5);

        const data = await mockNotifRepo.countUnread(userId);

        expect(mockDB.notifikasi.count).toHaveBeenCalledWith({
            where: { penerima_id: userId, is_read: false },
        });
        expect(data).toBe(5);
    });
});

describe('NotificationRepository.getByTypesAndDateRange', () => {
    it('mengembalikan notifikasi berdasarkan tipe dan rentang tanggal', async () => {
        const fakeNotifs = [createFakeNotif()];
        mockDB.notifikasi.findMany.mockResolvedValue(fakeNotifs as never);
        const start = new Date('2026-01-01T00:00:00Z');
        const end = new Date('2026-01-02T00:00:00Z');

        const data = await mockNotifRepo.getByTypesAndDateRange(['LAPORAN_BARU'], start, end);

        expect(mockDB.notifikasi.findMany).toHaveBeenCalledWith({
            where: { tipe: { in: ['LAPORAN_BARU'] }, created_at: { gte: start, lt: end } },
            include: expect.any(Object),
            orderBy: expect.any(Array),
        });
        expect(data).toEqual(fakeNotifs);
    });
});

describe('NotificationRepository.getByUserAndDateRange', () => {
    it('mengembalikan notifikasi milik user pada rentang tanggal', async () => {
        const fakeNotifs = [createFakeNotif()];
        mockDB.notifikasi.findMany.mockResolvedValue(fakeNotifs as never);
        const start = new Date('2026-01-01T00:00:00Z');
        const end = new Date('2026-01-02T00:00:00Z');

        const data = await mockNotifRepo.getByUserAndDateRange(userId, start, end);

        expect(mockDB.notifikasi.findMany).toHaveBeenCalledWith({
            where: { penerima_id: userId, created_at: { gte: start, lt: end } },
            include: expect.any(Object),
            orderBy: expect.any(Array),
        });
        expect(data).toEqual(fakeNotifs);
    });
});
