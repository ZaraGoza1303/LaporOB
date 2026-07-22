import type { PrismaClient, Prisma } from "../generated/prisma/client.js";
import type { Achievement, ObAchievement } from "../generated/prisma/client.js";
import type { IAchievementRepository, ObAchievementWithAchievement } from "./achievement_repository.interface.js";
import type { ObCompletedTask } from "./skill_repository.interface.js";

export class AchievementRepository implements IAchievementRepository {
    private db: PrismaClient;

    constructor(db: PrismaClient) {
        this.db = db;
    }

    async create(req: Prisma.AchievementUncheckedCreateInput): Promise<Achievement> {
        return this.db.achievement.create({ data: req });
    }

    async getByID(id: string): Promise<Achievement | null> {
        return this.db.achievement.findFirst({ where: { id } });
    }

    async getAll(includeInactive: boolean = false): Promise<Achievement[]> {
        return this.db.achievement.findMany({
            where: includeInactive ? {} : { is_active: true },
            orderBy: { created_at: "desc" },
        });
    }

    async getActive(): Promise<Achievement[]> {
        return this.db.achievement.findMany({
            where: { is_active: true },
        });
    }

    async update(id: string, req: Prisma.AchievementUncheckedUpdateInput): Promise<void> {
        await this.db.achievement.update({ where: { id }, data: req });
    }

    async softDelete(id: string): Promise<void> {
        await this.db.achievement.update({
            where: { id },
            data: { is_active: false },
        });
    }

    async getObAchievements(obId: string): Promise<ObAchievementWithAchievement[]> {
        return this.db.obAchievement.findMany({
            where: { ob_id: obId },
            include: { achievement: true },
            orderBy: { created_at: "desc" },
        });
    }

    async getAcquiredObAchievements(obId: string): Promise<ObAchievementWithAchievement[]> {
        return this.db.obAchievement.findMany({
            where: { ob_id: obId, diperoleh_at: { not: null } },
            include: { achievement: true },
            orderBy: { diperoleh_at: "desc" },
        });
    }

    async upsertProgress(obId: string, achievementId: string, progress: number): Promise<ObAchievement> {
        return this.db.obAchievement.upsert({
            where: { ob_id_achievement_id: { ob_id: obId, achievement_id: achievementId } },
            create: {
                ob_id: obId,
                achievement_id: achievementId,
                progress,
            },
            update: { progress },
        });
    }

    async markUnlocked(obId: string, achievementId: string): Promise<void> {
        await this.db.obAchievement.update({
            where: { ob_id_achievement_id: { ob_id: obId, achievement_id: achievementId } },
            data: { diperoleh_at: new Date() },
        });
    }

    async getCompletedTasks(obId?: string): Promise<ObCompletedTask[]> {
        const filter = obId ? `AND ob_id = $1::uuid` : ``;
        const params: unknown[] = obId ? [obId] : [];

        return this.db.$queryRawUnsafe<ObCompletedTask[]>(`
            SELECT ob_id, nama_tugas, dikerjakan_at, selesai_at FROM tugas
            WHERE status = 'SELESAI' ${filter}
            UNION ALL
            SELECT ob_id, nama_tugas, dikerjakan_at, selesai_at FROM checklist_harian
            WHERE status = 'SELESAI' ${filter}
            UNION ALL
            SELECT ob_id, deskripsi_kendala AS nama_tugas, dikerjakan_at, selesai_at FROM laporan_karyawan
            WHERE status = 'SELESAI' ${filter}
        `, ...params);
    }
}
