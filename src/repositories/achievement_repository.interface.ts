import { Prisma } from "../generated/prisma/client.js";
import type { Achievement, ObAchievement } from "../generated/prisma/client.js";
import type { ObCompletedTask } from "./skill_repository.interface.js";

export type { ObCompletedTask };

export type ObAchievementWithAchievement = Prisma.ObAchievementGetPayload<{
    include: { achievement: true }
}>;

export interface IAchievementRepository {
    create(req: Prisma.AchievementUncheckedCreateInput): Promise<Achievement>;
    getByID(id: string): Promise<Achievement | null>;
    getAll(includeInactive?: boolean): Promise<Achievement[]>;
    getActive(): Promise<Achievement[]>;
    update(id: string, req: Prisma.AchievementUncheckedUpdateInput): Promise<void>;
    softDelete(id: string): Promise<void>;

    getObAchievements(obId: string): Promise<ObAchievementWithAchievement[]>;
    getAcquiredObAchievements(obId: string): Promise<ObAchievementWithAchievement[]>;

    upsertProgress(obId: string, achievementId: string, progress: number): Promise<ObAchievement>;
    markUnlocked(obId: string, achievementId: string): Promise<void>;

    getCompletedTasks(obId?: string): Promise<ObCompletedTask[]>;
}
