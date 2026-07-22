import type { CreateSkillDefinitionReq, UpdateSkillDefinitionReq, AssignSkillReq, SkillDefinitionRes, ObSkillRes } from "../dto/skill.js";

export interface ISkillService {
    createDefinition(req: CreateSkillDefinitionReq): Promise<SkillDefinitionRes>;
    getDefinitionByID(skillId: string): Promise<SkillDefinitionRes | null>;
    getAllDefinitions(includeInactive: boolean): Promise<SkillDefinitionRes[]>;
    updateDefinition(skillId: string, req: UpdateSkillDefinitionReq): Promise<void>;
    deleteDefinition(skillId: string): Promise<void>;
    assignSkillToOb(req: AssignSkillReq, adminId: string): Promise<ObSkillRes>;
    getObSkills(obId: string): Promise<ObSkillRes[]>;
    getAcquiredObSkills(obId: string): Promise<ObSkillRes[]>;
    prosesSkillOtomatis(): Promise<number>;
    prosesSkillOtomatisForOb(obId: string): Promise<number>;
}
