import { beforeEach, describe, expect, it } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';
import { PrismaClient, Achievement, ObAchievement } from '../../../generated/prisma/client.js';
import { AchievementRepository } from '../../../repositories/achievement_repository.js';

const mockDB = mockDeep<PrismaClient>();
const mockAchievementRepo = new AchievementRepository(mockDB);

beforeEach(() => {
    mockReset(mockDB);
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
        threshold: 5,
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
        progress: 3,
        diperoleh_at: null,
        created_at: new Date('2026-01-01T00:00:00Z'),
        updated_at: new Date('2026-01-01T00:00:00Z'),
        ...overrides,
    };
}

describe('AchievementRepository.create', () => {
    it('membuat achievement dan mengembalikannya', async () => {
        const fakeAchievement = createFakeAchievement();
        const req = { nama: 'Rajin Membersihkan', tipe: 'KEYWORD', keyword: ['bersih'], threshold: 5 } as never;
        mockDB.achievement.create.mockResolvedValue(fakeAchievement);

        const data = await mockAchievementRepo.create(req);

        expect(mockDB.achievement.create).toHaveBeenCalledWith({ data: req });
        expect(data).toEqual(fakeAchievement);
    });
});

describe('AchievementRepository.getByID', () => {
    it('mengembalikan achievement sesuai id', async () => {
        const fakeAchievement = createFakeAchievement();
        mockDB.achievement.findFirst.mockResolvedValue(fakeAchievement);

        const data = await mockAchievementRepo.getByID(achievementId);

        expect(mockDB.achievement.findFirst).toHaveBeenCalledWith({ where: { id: achievementId } });
        expect(data).toEqual(fakeAchievement);
    });

    it('mengembalikan null jika tidak ditemukan', async () => {
        mockDB.achievement.findFirst.mockResolvedValue(null);

        const data = await mockAchievementRepo.getByID('not-exist');

        expect(data).toBeNull();
    });
});

describe('AchievementRepository.getAll', () => {
    it('mengembalikan achievement aktif saja secara default', async () => {
        const fakeAchievements = [createFakeAchievement()];
        mockDB.achievement.findMany.mockResolvedValue(fakeAchievements);

        const data = await mockAchievementRepo.getAll(false);

        expect(mockDB.achievement.findMany).toHaveBeenCalledWith({
            where: { is_active: true },
            orderBy: { created_at: 'desc' },
        });
        expect(data).toEqual(fakeAchievements);
    });

    it('mengembalikan semua termasuk nonaktif jika diminta', async () => {
        const fakeAchievements = [createFakeAchievement(), createFakeAchievement({ id: 'lain', is_active: false })];
        mockDB.achievement.findMany.mockResolvedValue(fakeAchievements);

        const data = await mockAchievementRepo.getAll(true);

        expect(mockDB.achievement.findMany).toHaveBeenCalledWith({
            where: {},
            orderBy: { created_at: 'desc' },
        });
        expect(data).toEqual(fakeAchievements);
    });
});

describe('AchievementRepository.update', () => {
    it('mengupdate achievement sesuai id', async () => {
        await mockAchievementRepo.update(achievementId, { nama: 'Baru' });

        expect(mockDB.achievement.update).toHaveBeenCalledWith({
            where: { id: achievementId },
            data: { nama: 'Baru' },
        });
    });
});

describe('AchievementRepository.softDelete', () => {
    it('menonaktifkan achievement tanpa menghapus data', async () => {
        await mockAchievementRepo.softDelete(achievementId);

        expect(mockDB.achievement.update).toHaveBeenCalledWith({
            where: { id: achievementId },
            data: { is_active: false },
        });
    });
});

describe('AchievementRepository.upsertProgress', () => {
    it('menyimpan progress terbaru milik ob', async () => {
        const fakeOb = createFakeObAchievement({ progress: 4 });
        mockDB.obAchievement.upsert.mockResolvedValue(fakeOb);

        const data = await mockAchievementRepo.upsertProgress(obId, achievementId, 4);

        expect(mockDB.obAchievement.upsert).toHaveBeenCalledWith({
            where: { ob_id_achievement_id: { ob_id: obId, achievement_id: achievementId } },
            create: { ob_id: obId, achievement_id: achievementId, progress: 4 },
            update: { progress: 4 },
        });
        expect(data).toEqual(fakeOb);
    });
});

describe('AchievementRepository.markUnlocked', () => {
    it('mengisi diperoleh_at sebagai tanda achievement didapat', async () => {
        await mockAchievementRepo.markUnlocked(obId, achievementId);

        expect(mockDB.obAchievement.update).toHaveBeenCalledWith({
            where: { ob_id_achievement_id: { ob_id: obId, achievement_id: achievementId } },
            data: { diperoleh_at: expect.any(Date) },
        });
    });
});

describe('AchievementRepository.getCompletedTasks', () => {
    it('mengembalikan tugas selesai dari semua ob tanpa filter', async () => {
        mockDB.$queryRawUnsafe.mockResolvedValue([]);

        await mockAchievementRepo.getCompletedTasks();

        expect(mockDB.$queryRawUnsafe).toHaveBeenCalledWith(
            expect.not.stringContaining('$1::uuid')
        );
    });

    it('mengembalikan tugas selesai milik satu ob saja', async () => {
        mockDB.$queryRawUnsafe.mockResolvedValue([]);

        await mockAchievementRepo.getCompletedTasks(obId);

        expect(mockDB.$queryRawUnsafe).toHaveBeenCalledWith(
            expect.stringContaining('AND ob_id = $1::uuid'),
            obId
        );
    });
});
