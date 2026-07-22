import type { SkillDefinition, ObSkill, Prisma } from "../generated/prisma/client.js";

export interface ISkillRepository {
    createDefinition(req: Prisma.SkillDefinitionUncheckedCreateInput): Promise<SkillDefinition>;
    getDefinitionByID(skillId: string): Promise<SkillDefinition | null>;
    getAllDefinitions(includeInactive?: boolean): Promise<SkillDefinition[]>;
    getActiveAutoDefinitions(): Promise<SkillDefinition[]>;
    updateDefinition(skillId: string, req: Prisma.SkillDefinitionUncheckedUpdateInput): Promise<void>;
    softDeleteDefinition(skillId: string): Promise<void>;

    getObSkills(obId: string): Promise<ObSkill[]>;
    getAcquiredObSkills(obId: string): Promise<ObSkill[]>;
    getObSkill(obId: string, skillId: string): Promise<ObSkill | null>;
    assignSkill(obId: string, skillId: string, assignedBy: string | null): Promise<ObSkill>;
    incrementCounter(obId: string, skillId: string): Promise<ObSkill>;
    markUnlocked(obId: string, skillId: string): Promise<void>;
}
