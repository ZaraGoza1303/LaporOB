import type { CreateAchievementReq, UpdateAchievementReq } from "../dto/achievement.js";
import type { AchievementRes, ObAchievementRes } from "../types/achievement.js";

export interface IAchievementService {
    create(req: CreateAchievementReq): Promise<AchievementRes>;
    getByID(id: string): Promise<AchievementRes | null>;
    getAll(includeInactive: boolean): Promise<AchievementRes[]>;
    update(id: string, req: UpdateAchievementReq): Promise<void>;
    delete(id: string): Promise<void>;

    getObAchievements(obId: string): Promise<ObAchievementRes[]>;
    getAcquiredObAchievements(obId: string): Promise<ObAchievementRes[]>;

    prosesOtomatis(): Promise<number>;
    prosesOtomatisUntukOb(obId: string): Promise<number>;
}
