import type { CreateAchievementReq, UpdateAchievementReq } from "../dto/achievement.js";
import type { AchievementRes, ObAchievementRes } from "../types/achievement.js";
import type { IAchievementRepository, ObCompletedTask } from "../repositories/achievement_repository.interface.js";
import type { IAchievementService } from "./achievement_service.interface.js";
import type { Achievement, ObAchievement, Prisma } from "../generated/prisma/client.js";
import { handlePrismaError } from "../utils/error.js";
import { NOTIFICATION_TITLE, NOTIFICATION_TYPE, NOTIFICATION_MESSAGE, REF_TIPE } from "../utils/constants.js";
import type { INotificationService } from "./notification_service.interface.js";
import type { BulkNotificationData } from "../types/notification.js";
import { matchSkillIds } from "../utils/skillMatcher.js";

export class AchievementService implements IAchievementService {
    private achievementRepo: IAchievementRepository;
    private notificationService: INotificationService;

    constructor(
        achievementRepo: IAchievementRepository,
        notificationService: INotificationService,
    ) {
        this.achievementRepo = achievementRepo;
        this.notificationService = notificationService;
    }

    private mapAchievement(a: Achievement): AchievementRes {
        return {
            id: a.id,
            nama: a.nama,
            deskripsi: a.deskripsi,
            tipe: a.tipe,
            keyword: a.keyword,
            threshold: a.threshold,
            response_time_threshold_seconds: a.response_time_threshold_seconds,
            icon: a.icon,
            is_active: a.is_active,
            created_at: a.created_at,
            updated_at: a.updated_at,
        };
    }

    private mapObAchievement(oa: ObAchievement, a: Achievement): ObAchievementRes {
        return {
            id: oa.id,
            achievement_id: oa.achievement_id,
            nama: a.nama,
            tipe: a.tipe,
            keyword: a.keyword,
            deskripsi: a.deskripsi,
            progress: oa.progress,
            diperoleh_at: oa.diperoleh_at,
            icon: a.icon,
            created_at: oa.created_at,
            updated_at: oa.updated_at,
        };
    }

    async create(req: CreateAchievementReq): Promise<AchievementRes> {
        try {
            const created = await this.achievementRepo.create({
                nama: req.nama,
                deskripsi: req.deskripsi ?? null,
                tipe: req.tipe,
                keyword: req.keyword,
                threshold: req.threshold,
                response_time_threshold_seconds: req.response_time_threshold_seconds ?? null,
                icon: req.icon ?? null,
                is_active: true,
            });
            return this.mapAchievement(created);
        } catch (err) {
            handlePrismaError(err);
        }
    }

    async getByID(id: string): Promise<AchievementRes | null> {
        try {
            const a = await this.achievementRepo.getByID(id);
            return a ? this.mapAchievement(a) : null;
        } catch (err) {
            handlePrismaError(err);
        }
    }

    async getAll(includeInactive: boolean): Promise<AchievementRes[]> {
        try {
            const items = await this.achievementRepo.getAll(includeInactive);
            return items.map(a => this.mapAchievement(a));
        } catch (err) {
            handlePrismaError(err);
        }
    }

    async update(id: string, req: UpdateAchievementReq): Promise<void> {
        try {
            const data: Prisma.AchievementUncheckedUpdateInput = {};
            if (req.nama !== undefined) data.nama = req.nama;
            if (req.deskripsi !== undefined) data.deskripsi = req.deskripsi;
            if (req.tipe !== undefined) data.tipe = req.tipe;
            if (req.keyword !== undefined) data.keyword = req.keyword;
            if (req.threshold !== undefined) data.threshold = req.threshold;
            if (req.response_time_threshold_seconds !== undefined) data.response_time_threshold_seconds = req.response_time_threshold_seconds;
            if (req.icon !== undefined) data.icon = req.icon;
            if (req.is_active !== undefined) data.is_active = req.is_active;

            await this.achievementRepo.update(id, data);
        } catch (err) {
            handlePrismaError(err);
        }
    }

    async delete(id: string): Promise<void> {
        try {
            await this.achievementRepo.softDelete(id);
        } catch (err) {
            handlePrismaError(err);
        }
    }

    async getObAchievements(obId: string): Promise<ObAchievementRes[]> {
        try {
            const items = await this.achievementRepo.getObAchievements(obId);
            const result: ObAchievementRes[] = [];
            for (const oa of items) {
                result.push(this.mapObAchievement(oa, oa.achievement));
            }
            return result;
        } catch (err) {
            handlePrismaError(err);
        }
    }

    async getAcquiredObAchievements(obId: string): Promise<ObAchievementRes[]> {
        try {
            const items = await this.achievementRepo.getAcquiredObAchievements(obId);
            const result: ObAchievementRes[] = [];
            for (const oa of items) {
                result.push(this.mapObAchievement(oa, oa.achievement));
            }
            return result;
        } catch (err) {
            handlePrismaError(err);
        }
    }

    async prosesOtomatis(): Promise<number> {
        try {
            const achievements = await this.achievementRepo.getActive();
            if (achievements.length === 0) return 0;

            const tasks = await this.achievementRepo.getCompletedTasks();
            if (tasks.length === 0) return 0;

            return this.processDefinitions(achievements, tasks);
        } catch (err) {
            handlePrismaError(err);
        }
    }

    async prosesOtomatisUntukOb(obId: string): Promise<number> {
        try {
            const achievements = await this.achievementRepo.getActive();
            if (achievements.length === 0) return 0;

            const tasks = await this.achievementRepo.getCompletedTasks(obId);
            if (tasks.length === 0) return 0;

            return this.processDefinitions(achievements, tasks);
        } catch (err) {
            handlePrismaError(err);
        }
    }

    private async processDefinitions(
        achievements: Achievement[],
        tasks: ObCompletedTask[],
    ): Promise<number> {
        const tasksByOb = new Map<string, ObCompletedTask[]>();
        for (const task of tasks) {
            const arr = tasksByOb.get(task.ob_id) ?? [];
            arr.push(task);
            tasksByOb.set(task.ob_id, arr);
        }

        let unlockedCount = 0;
        const notified: Array<{ ob_id: string; nama: string }> = [];

        for (const [obId, obTasks] of tasksByOb) {
            for (const a of achievements) {
                const progress = this.computeProgress(a, obTasks);

                const updated = await this.achievementRepo.upsertProgress(obId, a.id, progress);

                if (updated.diperoleh_at === null && progress >= a.threshold && a.threshold > 0) {
                    await this.achievementRepo.markUnlocked(obId, a.id);
                    notified.push({ ob_id: obId, nama: a.nama });
                    unlockedCount++;
                }
            }
        }

        for (const n of notified) {
            await this.sendNotification(n.ob_id, n.nama, null);
        }

        return unlockedCount;
    }

    private computeProgress(a: Achievement, obTasks: ObCompletedTask[]): number {
        if (a.tipe === "COMPLETION_COUNT") {
            return obTasks.length;
        }

        if (a.tipe === "FAST_RESPONSE") {
            const thresholdSec = a.response_time_threshold_seconds ?? 300;
            let count = 0;
            for (const task of obTasks) {
                if (task.selesai_at && task.dikerjakan_at) {
                    const diffSec = (task.selesai_at.getTime() - task.dikerjakan_at.getTime()) / 1000;
                    if (diffSec <= thresholdSec) count++;
                }
            }
            return count;
        }

        let count = 0;
        for (const task of obTasks) {
            const matches = matchSkillIds(task.nama_tugas, [{ id: a.id, keyword: a.keyword }]);
            if (matches.length > 0) count++;
        }
        return count;
    }

    private async sendNotification(penerimaId: string, nama: string, pengirimId: string | null): Promise<void> {
        const notifData: BulkNotificationData = {
            penerima_ids: [penerimaId],
            pengirim_id: pengirimId,
            tipe: NOTIFICATION_TYPE.ACHIEVEMENT_DI_PEROLEH,
            judul: NOTIFICATION_TITLE.ACHIEVEMENT_DI_PEROLEH,
            pesan: `${NOTIFICATION_MESSAGE.ACHIEVEMENT_DI_PEROLEH}: ${nama}`,
            ref_tipe: REF_TIPE.SKILL,
        };
        await this.notificationService.sendBulkNotification(notifData);
    }
}
