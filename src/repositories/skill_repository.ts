import type { PrismaClient, Prisma } from "../generated/prisma/client.js";
import type { SkillDefinition, ObSkill } from "../generated/prisma/client.js";
import type { ISkillRepository, ObCompletedTask } from "./skill_repository.interface.js";

export class SkillRepository implements ISkillRepository {
    private db: PrismaClient;

    constructor(db: PrismaClient) {
        this.db = db;
    }

    async createDefinition(req: Prisma.SkillDefinitionUncheckedCreateInput): Promise<SkillDefinition> {
        return this.db.skillDefinition.create({ data: req });
    }

    async getDefinitionByID(skillId: string): Promise<SkillDefinition | null> {
        return this.db.skillDefinition.findFirst({ where: { id: skillId } });
    }

    async getAllDefinitions(includeInactive: boolean = false): Promise<SkillDefinition[]> {
        return this.db.skillDefinition.findMany({
            where: includeInactive ? {} : { is_active: true },
            orderBy: { created_at: "desc" },
        });
    }

    async getActiveAutoDefinitions(): Promise<SkillDefinition[]> {
        return this.db.skillDefinition.findMany({
            where: { is_active: true, is_auto: true },
        });
    }

    async updateDefinition(skillId: string, req: Prisma.SkillDefinitionUncheckedUpdateInput): Promise<void> {
        await this.db.skillDefinition.update({ where: { id: skillId }, data: req });
    }

    async softDeleteDefinition(skillId: string): Promise<void> {
        await this.db.skillDefinition.update({
            where: { id: skillId },
            data: { is_active: false },
        });
    }

    async getObSkills(obId: string): Promise<ObSkill[]> {
        return this.db.obSkill.findMany({
            where: { ob_id: obId },
            include: { skill: true },
            orderBy: { created_at: "desc" },
        });
    }

    async getAcquiredObSkills(obId: string): Promise<ObSkill[]> {
        return this.db.obSkill.findMany({
            where: { ob_id: obId, diperoleh_at: { not: null } },
            include: { skill: true },
            orderBy: { diperoleh_at: "desc" },
        });
    }

    async getObSkill(obId: string, skillId: string): Promise<ObSkill | null> {
        return this.db.obSkill.findFirst({ where: { ob_id: obId, skill_id: skillId } });
    }

    async assignSkill(obId: string, skillId: string, assignedBy: string | null): Promise<ObSkill> {
        return this.db.obSkill.upsert({
            where: { ob_id_skill_id: { ob_id: obId, skill_id: skillId } },
            create: {
                ob_id: obId,
                skill_id: skillId,
                assigned_by: assignedBy,
                diperoleh_at: new Date(),
            },
            update: {
                assigned_by: assignedBy,
                diperoleh_at: new Date(),
            },
        });
    }

    async incrementCounter(obId: string, skillId: string): Promise<ObSkill> {
        return this.db.obSkill.upsert({
            where: { ob_id_skill_id: { ob_id: obId, skill_id: skillId } },
            create: {
                ob_id: obId,
                skill_id: skillId,
                jumlah_selesai: 1,
                assigned_by: null,
            },
            update: {
                jumlah_selesai: { increment: 1 },
            },
        });
    }

    async markUnlocked(obId: string, skillId: string): Promise<void> {
        await this.db.obSkill.update({
            where: { ob_id_skill_id: { ob_id: obId, skill_id: skillId } },
            data: { diperoleh_at: new Date() },
        });
    }

    async getCompletedTasks(obId?: string): Promise<ObCompletedTask[]> {
        const filter = obId ? `AND ob_id = $1::uuid` : ``;
        const params: unknown[] = obId ? [obId] : [];

        return this.db.$queryRawUnsafe<ObCompletedTask[]>(`
            SELECT ob_id, nama_tugas, dikerjakan_at, selesai_at FROM tugas
            WHERE status = 'SELESAI' AND ob_id IS NOT NULL ${filter}
            UNION ALL
            SELECT ob_id, nama_tugas, dikerjakan_at, selesai_at FROM checklist_harian
            WHERE status = 'SELESAI' AND ob_id IS NOT NULL ${filter}
            UNION ALL
            SELECT ob_id, deskripsi_kendala AS nama_tugas, dikerjakan_at, selesai_at FROM laporan_karyawan
            WHERE status = 'SELESAI' AND ob_id IS NOT NULL ${filter}
        `, ...params);
    }

    async upsertSkillProgress(obId: string, skillId: string, jumlahSelesai: number): Promise<ObSkill> {
        return this.db.obSkill.upsert({
            where: { ob_id_skill_id: { ob_id: obId, skill_id: skillId } },
            create: {
                ob_id: obId,
                skill_id: skillId,
                jumlah_selesai: jumlahSelesai,
                assigned_by: null,
            },
            update: {
                jumlah_selesai: jumlahSelesai,
            },
        });
    }
}
