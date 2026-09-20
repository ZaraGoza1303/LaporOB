import type { CreateSkillDefinitionReq, UpdateSkillDefinitionReq, AssignSkillReq } from "../dto/skill.js";
import type { SkillDefinitionRes, ObSkillRes } from "../types/skill.js";
import type { ISkillRepository, ObCompletedTask } from "../repositories/skill_repository.interface.js";
import type { ISkillService } from "./skill_service.interface.js";
import type { SkillDefinition, ObSkill, Prisma } from "../generated/prisma/client.js";
import { handlePrismaError } from "../utils/error.js";
import { AppError } from "../utils/error.js";
import { matchSkillIds } from "../utils/skillMatcher.js";
import { NOTIFICATION_TITLE, NOTIFICATION_TYPE, NOTIFICATION_MESSAGE, REF_TIPE } from "../utils/constants.js";
import type { INotificationService } from "./notification_service.interface.js";
import type { BulkNotificationData } from "../types/notification.js";

export class SkillService implements ISkillService {
    private skillRepo: ISkillRepository;
    private notificationService: INotificationService;

    constructor(
        skillRepo: ISkillRepository,
        notificationService: INotificationService,
    ) {
        this.skillRepo = skillRepo;
        this.notificationService = notificationService;
    }

    private mapDefinition(def: SkillDefinition): SkillDefinitionRes {
        return {
            id: def.id,
            nama_skill: def.nama_skill,
            keyword: def.keyword,
            deskripsi: def.deskripsi,
            is_auto: def.is_auto,
            is_active: def.is_active,
            threshold: def.threshold,
            created_at: def.created_at,
            updated_at: def.updated_at,
        };
    }

    private mapObSkill(skill: ObSkill, def: SkillDefinition): ObSkillRes {
        return {
            id: skill.id,
            skill_id: skill.skill_id,
            nama_skill: def.nama_skill,
            keyword: def.keyword,
            deskripsi: def.deskripsi,
            jumlah_selesai: skill.jumlah_selesai,
            assigned_by: skill.assigned_by,
            diperoleh_at: skill.diperoleh_at,
            created_at: skill.created_at,
            updated_at: skill.updated_at,
        };
    }

    async createDefinition(req: CreateSkillDefinitionReq): Promise<SkillDefinitionRes> {
        try {
            const created = await this.skillRepo.createDefinition({
                nama_skill: req.nama_skill,
                keyword: req.keyword,
                deskripsi: req.deskripsi ?? null,
                is_auto: req.is_auto,
                threshold: req.threshold,
                is_active: true,
            });
            return this.mapDefinition(created);
        } catch (err) {
            handlePrismaError(err);
        }
    }

    async getDefinitionByID(skillId: string): Promise<SkillDefinitionRes | null> {
        try {
            const def = await this.skillRepo.getDefinitionByID(skillId);
            return def ? this.mapDefinition(def) : null;
        } catch (err) {
            handlePrismaError(err);
        }
    }

    async getAllDefinitions(includeInactive: boolean): Promise<SkillDefinitionRes[]> {
        try {
            const defs = await this.skillRepo.getAllDefinitions(includeInactive);
            return defs.map(d => this.mapDefinition(d));
        } catch (err) {
            handlePrismaError(err);
        }
    }

    async updateDefinition(skillId: string, req: UpdateSkillDefinitionReq): Promise<void> {
        try {
            const dataToUpdate: Prisma.SkillDefinitionUncheckedUpdateInput = {};
            if (req.nama_skill !== undefined) dataToUpdate.nama_skill = req.nama_skill;
            if (req.keyword !== undefined) dataToUpdate.keyword = req.keyword;
            if (req.deskripsi !== undefined) dataToUpdate.deskripsi = req.deskripsi;
            if (req.is_auto !== undefined) dataToUpdate.is_auto = req.is_auto;
            if (req.is_active !== undefined) dataToUpdate.is_active = req.is_active;
            if (req.threshold !== undefined) dataToUpdate.threshold = req.threshold;

            await this.skillRepo.updateDefinition(skillId, dataToUpdate);
        } catch (err) {
            handlePrismaError(err);
        }
    }

    async deleteDefinition(skillId: string): Promise<void> {
        try {
            await this.skillRepo.softDeleteDefinition(skillId);
        } catch (err) {
            handlePrismaError(err);
        }
    }

    async assignSkillToOb(req: AssignSkillReq, adminId: string): Promise<ObSkillRes> {
        try {
            const def = await this.skillRepo.getDefinitionByID(req.skill_id);
            if (!def) {
                throw new AppError("Skill definition tidak ditemukan", 404);
            }
            const assigned = await this.skillRepo.assignSkill(req.ob_id, req.skill_id, adminId);

            await this.sendNotification(req.ob_id, def.nama_skill, adminId);

            return this.mapObSkill(assigned, def);
        } catch (err) {
            handlePrismaError(err);
        }
    }

    async getAcquiredObSkills(obId: string): Promise<ObSkillRes[]> {
        try {
            const skills = await this.skillRepo.getAcquiredObSkills(obId);
            const result: ObSkillRes[] = [];
            for (const s of skills) {
                const def = await this.skillRepo.getDefinitionByID(s.skill_id);
                if (!def) continue;
                result.push(this.mapObSkill(s, def));
            }
            return result;
        } catch (err) {
            handlePrismaError(err);
        }
    }

    async getObSkills(obId: string): Promise<ObSkillRes[]> {
        try {
            const skills = await this.skillRepo.getObSkills(obId);
            const result: ObSkillRes[] = [];
            for (const s of skills) {
                const def = await this.skillRepo.getDefinitionByID(s.skill_id);
                if (!def) continue;
                result.push(this.mapObSkill(s, def));
            }
            return result;
        } catch (err) {
            handlePrismaError(err);
        }
    }

    async prosesSkillOtomatis(): Promise<number> {
        try {
            const definitions = await this.skillRepo.getActiveAutoDefinitions();
            if (definitions.length === 0) return 0;

            const tasks = await this.skillRepo.getCompletedTasks();
            if (tasks.length === 0) return 0;

            return this.processDefinitions(definitions, tasks);
        } catch (err) {
            handlePrismaError(err);
        }
    }

    async prosesSkillOtomatisForOb(obId: string): Promise<number> {
        try {
            const definitions = await this.skillRepo.getActiveAutoDefinitions();
            if (definitions.length === 0) return 0;

            const tasks = await this.skillRepo.getCompletedTasks(obId);
            if (tasks.length === 0) return 0;

            return this.processDefinitions(definitions, tasks);
        } catch (err) {
            handlePrismaError(err);
        }
    }

    private async processDefinitions(
        definitions: SkillDefinition[],
        tasks: ObCompletedTask[],
    ): Promise<number> {
        const tasksByOb = new Map<string, ObCompletedTask[]>();
        for (const task of tasks) {
            const arr = tasksByOb.get(task.ob_id) ?? [];
            arr.push(task);
            tasksByOb.set(task.ob_id, arr);
        }

        let unlockedCount = 0;
        const notified: Array<{ ob_id: string; nama_skill: string }> = [];

        for (const [obId, obTasks] of tasksByOb) {
            for (const def of definitions) {
                let count = 0;
                for (const task of obTasks) {
                    const matches = matchSkillIds(task.nama_tugas, [def]);
                    if (matches.length > 0) count++;
                }

                const updated = await this.skillRepo.upsertSkillProgress(obId, def.id, count);

                if (updated.diperoleh_at === null && count >= def.threshold && def.threshold > 0) {
                    await this.skillRepo.markUnlocked(obId, def.id);
                    notified.push({ ob_id: obId, nama_skill: def.nama_skill });
                    unlockedCount++;
                }
            }
        }

        for (const n of notified) {
            await this.sendNotification(n.ob_id, n.nama_skill, null);
        }

        return unlockedCount;
    }

    private async sendNotification(penerimaId: string, namaSkill: string, pengirimId: string | null): Promise<void> {
        const notifData: BulkNotificationData = {
            penerima_ids: [penerimaId],
            pengirim_id: pengirimId,
            tipe: NOTIFICATION_TYPE.SKILL_DI_PEROLEH,
            judul: NOTIFICATION_TITLE.SKILL_DI_PEROLEH,
            pesan: `${NOTIFICATION_MESSAGE.SKILL_DI_PEROLEH}: ${namaSkill}`,
            ref_tipe: REF_TIPE.SKILL,
        };
        await this.notificationService.sendBulkNotification(notifData);
    }
}
