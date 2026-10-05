import { beforeEach, describe, expect, it } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";
import { PrismaClient, Achievement, ObAchievement } from "../../../generated/prisma/client";
import { AchievementRepository } from "../../../repositories/achievement_repository";
import { AchievementService } from "../../../services/achievement_service";
import type { INotificationService } from "../../../services/notification_service.interface";

const mockDB = mockDeep<PrismaClient>();
const mockNotificationService = mockDeep<INotificationService>();

const mockAchievementRepo = new AchievementRepository(mockDB);
const mockAchievementService = new AchievementService(mockAchievementRepo, mockNotificationService);

beforeEach(() => {
    mockReset(mockDB);
    mockReset(mockNotificationService);
});

const achievementId = '3f2a1b7c-9d4e-4a51-8c6f-1d2e3f4a5b6c';
const obId = 'e2fbdc6f-ec0d-4547-a51d-a81b69741ed2';

// Fungsi generate fake data dan bisa juga override
function createFakeAchievement(overrides?: Partial<Achievement>): Achievement {
    return {
        id: achievementId,
        nama: 'Rajin Membersihkan',
        deskripsi: 'Selesaikan 5 tugas',
        tipe: 'KEYWORD',
        keyword: ['bersih'],
        threshold: 2,
        response_time_threshold_seconds: null,
        icon: null,
        is_active: true,
        created_at: new Date('2026-01-01T00:00:00Z'),
        updated_at: new Date('2026-01-01T00:00:00Z'),
        ...overrides,
    };
}

// Fungsi generate fake data dan bisa juga override
function createFakeObAchievement(overrides?: Partial<ObAchievement>): ObAchievement {
    return {
        id: 'b7c8d9e0-1f2a-4b3c-9d4e-5f6a7b8c9d0e',
        ob_id: obId,
        achievement_id: achievementId,
        progress: 2,
        diperoleh_at: null,
        created_at: new Date('2026-01-01T00:00:00Z'),
        updated_at: new Date('2026-01-01T00:00:00Z'),
        ...overrides,
    };
}

describe('AchievementService.create', () => {
    it('membuat achievement baru dan mengembalikan hasil mapping', async () => {
        const fakeAchievement = createFakeAchievement();
        mockDB.achievement.create.mockResolvedValue(fakeAchievement);

        const data = await mockAchievementService.create({
            nama: 'Rajin Membersihkan',
            keyword: ['bersih'],
            threshold: 2,
        });

        expect(mockDB.achievement.create).toHaveBeenCalledWith({
            data: expect.objectContaining({ nama: 'Rajin Membersihkan', is_active: true }),
        });
        expect(data.nama).toBe('Rajin Membersihkan');
    });
});

describe('AchievementService.getByID', () => {
    it('mengembalikan detail achievement', async () => {
        mockDB.achievement.findFirst.mockResolvedValue(createFakeAchievement());

        const data = await mockAchievementService.getByID(achievementId);

        expect(data?.nama).toBe('Rajin Membersihkan');
    });

    it('mengembalikan null jika tidak ditemukan', async () => {
        mockDB.achievement.findFirst.mockResolvedValue(null);

        const data = await mockAchievementService.getByID('not-exist');

        expect(data).toBeNull();
    });
});

describe('AchievementService.getAll', () => {
    it('mengembalikan daftar achievement aktif saja', async () => {
        mockDB.achievement.findMany.mockResolvedValue([createFakeAchievement()]);

        const data = await mockAchievementService.getAll(false);

        expect(mockDB.achievement.findMany).toHaveBeenCalledWith({
            where: { is_active: true },
            orderBy: { created_at: 'desc' },
        });
        expect(data).toHaveLength(1);
    });
});

describe('AchievementService.update', () => {
    it('hanya mengirim field yang diisi', async () => {
        mockDB.achievement.update.mockResolvedValue(createFakeAchievement());

        await mockAchievementService.update(achievementId, { nama: 'Baru', threshold: 10 });

        expect(mockDB.achievement.update).toHaveBeenCalledWith({
            where: { id: achievementId },
            data: { nama: 'Baru', threshold: 10 },
        });
    });
});

describe('AchievementService.delete', () => {
    it('menonaktifkan achievement tanpa menghapus data', async () => {
        mockDB.achievement.update.mockResolvedValue(createFakeAchievement({ is_active: false }));

        await mockAchievementService.delete(achievementId);

        expect(mockDB.achievement.update).toHaveBeenCalledWith({
            where: { id: achievementId },
            data: { is_active: false },
        });
    });
});

describe('AchievementService.prosesOtomatis', () => {
    it('mengembalikan 0 jika tidak ada achievement aktif', async () => {
        mockDB.achievement.findMany.mockResolvedValue([]);

        const data = await mockAchievementService.prosesOtomatis();

        expect(data).toBe(0);
        expect(mockDB.$queryRawUnsafe).not.toHaveBeenCalled();
    });

    it('membuka achievement dan mengirim notifikasi jika threshold terpenuhi', async () => {
        mockDB.achievement.findMany.mockResolvedValue([createFakeAchievement({ threshold: 1 })]);
        mockDB.$queryRawUnsafe.mockResolvedValue([
            { ob_id: obId, nama_tugas: 'Bersih kaca', dikerjakan_at: new Date(), selesai_at: new Date() },
        ]);
        mockDB.obAchievement.upsert.mockResolvedValue(createFakeObAchievement({ progress: 1, diperoleh_at: null }));
        mockDB.obAchievement.update.mockResolvedValue(createFakeObAchievement());

        const data = await mockAchievementService.prosesOtomatis();

        expect(mockDB.obAchievement.update).toHaveBeenCalled();
        expect(mockNotificationService.sendBulkNotification).toHaveBeenCalledWith(
            expect.objectContaining({ penerima_ids: [obId] })
        );
        expect(data).toBe(1);
    });

    it('tidak membuka achievement jika progress belum cukup', async () => {
        mockDB.achievement.findMany.mockResolvedValue([createFakeAchievement({ threshold: 5 })]);
        mockDB.$queryRawUnsafe.mockResolvedValue([
            { ob_id: obId, nama_tugas: 'Bersih kaca', dikerjakan_at: new Date(), selesai_at: new Date() },
        ]);
        mockDB.obAchievement.upsert.mockResolvedValue(createFakeObAchievement({ progress: 1, diperoleh_at: null }));

        const data = await mockAchievementService.prosesOtomatis();

        expect(mockDB.obAchievement.update).not.toHaveBeenCalled();
        expect(data).toBe(0);
    });
});
