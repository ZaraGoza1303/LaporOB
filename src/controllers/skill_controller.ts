import type { Request, Response } from "express";
import { sendErrorResponse, sendSuccessfullResponse } from "../utils/response.js";
import type { ISkillService } from "../services/skill_service.interface.js";
import {
    CreateSkillDefinitionSchema,
    UpdateSkillDefinitionSchema,
    AssignSkillSchema,
    SkillIdParamSchema,
} from "../dto/skill.js";
import { AppError } from "../utils/error.js";

export class SkillController {
    private skillService: ISkillService;

    constructor(skillService: ISkillService) {
        this.skillService = skillService;
    }

    async createDefinition(req: Request, res: Response) {
        try {
            if (!req.body) return res.status(400).json(sendErrorResponse("Request body empty"));
            const validate = CreateSkillDefinitionSchema.safeParse(req.body);
            if (!validate.success) {
                return res.status(400).json(sendErrorResponse("Validation Failed", validate.error.flatten().fieldErrors));
            }
            const result = await this.skillService.createDefinition(validate.data);
            return res.status(201).json(sendSuccessfullResponse("Berhasil menambahkan skill definition", result));
        } catch (err: unknown) {
            if (err instanceof AppError) return res.status(err.statusCode).json(sendErrorResponse(err.message));
            return res.status(500).json(sendErrorResponse("Gagal menambahkan skill definition"));
        }
    }

    async getAllDefinitions(req: Request, res: Response) {
        try {
            const includeInactive = req.query.include_inactive === "true";
            const result = await this.skillService.getAllDefinitions(includeInactive);
            return res.status(200).json(sendSuccessfullResponse("Berhasil mengambil daftar skill", result));
        } catch (err: unknown) {
            if (err instanceof AppError) return res.status(err.statusCode).json(sendErrorResponse(err.message));
            return res.status(500).json(sendErrorResponse("Gagal mengambil daftar skill"));
        }
    }

    async getDefinitionByID(req: Request, res: Response) {
        try {
            const validate = SkillIdParamSchema.safeParse(req.params);
            if (!validate.success) {
                return res.status(400).json(sendErrorResponse("Validation Failed", validate.error.flatten().fieldErrors));
            }
            const result = await this.skillService.getDefinitionByID(validate.data.skill_id);
            if (!result) return res.status(404).json(sendErrorResponse("Skill definition tidak ditemukan"));
            return res.status(200).json(sendSuccessfullResponse("Berhasil mengambil skill definition", result));
        } catch (err: unknown) {
            if (err instanceof AppError) return res.status(err.statusCode).json(sendErrorResponse(err.message));
            return res.status(500).json(sendErrorResponse("Gagal mengambil skill definition"));
        }
    }

    async updateDefinition(req: Request, res: Response) {
        try {
            const validateParams = SkillIdParamSchema.safeParse(req.params);
            if (!validateParams.success) {
                return res.status(400).json(sendErrorResponse("Validation Failed", validateParams.error.flatten().fieldErrors));
            }
            if (!req.body) return res.status(400).json(sendErrorResponse("Request body empty"));
            const validateBody = UpdateSkillDefinitionSchema.safeParse(req.body);
            if (!validateBody.success) {
                return res.status(400).json(sendErrorResponse("Validation Failed", validateBody.error.flatten().fieldErrors));
            }
            await this.skillService.updateDefinition(validateParams.data.skill_id, validateBody.data);
            return res.status(200).json(sendSuccessfullResponse("Berhasil mengupdate skill definition"));
        } catch (err: unknown) {
            if (err instanceof AppError) return res.status(err.statusCode).json(sendErrorResponse(err.message));
            return res.status(500).json(sendErrorResponse("Gagal mengupdate skill definition"));
        }
    }

    async deleteDefinition(req: Request, res: Response) {
        try {
            const validate = SkillIdParamSchema.safeParse(req.params);
            if (!validate.success) {
                return res.status(400).json(sendErrorResponse("Validation Failed", validate.error.flatten().fieldErrors));
            }
            await this.skillService.deleteDefinition(validate.data.skill_id);
            return res.status(200).json(sendSuccessfullResponse("Berhasil menghapus skill definition"));
        } catch (err: unknown) {
            if (err instanceof AppError) return res.status(err.statusCode).json(sendErrorResponse(err.message));
            return res.status(500).json(sendErrorResponse("Gagal menghapus skill definition"));
        }
    }

    async assignSkill(req: Request, res: Response) {
        try {
            if (!req.body) return res.status(400).json(sendErrorResponse("Request body empty"));
            const validate = AssignSkillSchema.safeParse(req.body);
            if (!validate.success) {
                return res.status(400).json(sendErrorResponse("Validation Failed", validate.error.flatten().fieldErrors));
            }
            const adminId = req.user?.id as string;
            const result = await this.skillService.assignSkillToOb(validate.data, adminId);
            return res.status(200).json(sendSuccessfullResponse("Berhasil menugaskan skill ke OB", result));
        } catch (err: unknown) {
            if (err instanceof AppError) return res.status(err.statusCode).json(sendErrorResponse(err.message));
            return res.status(500).json(sendErrorResponse("Gagal menugaskan skill ke OB"));
        }
    }

    async getObSkills(req: Request, res: Response) {
        try {
            const ob_id = req.params.ob_id as string;
            if (!ob_id) return res.status(400).json(sendErrorResponse("ob_id wajib diisi"));
            const result = await this.skillService.getObSkills(ob_id);
            return res.status(200).json(sendSuccessfullResponse("Berhasil mengambil skill OB", result));
        } catch (err: unknown) {
            if (err instanceof AppError) return res.status(err.statusCode).json(sendErrorResponse(err.message));
            return res.status(500).json(sendErrorResponse("Gagal mengambil skill OB"));
        }
    }

    async getMySkills(req: Request, res: Response) {
        try {
            const obId = req.user?.id as string;
            const result = await this.skillService.getObSkills(obId);
            return res.status(200).json(sendSuccessfullResponse("Berhasil mengambil skill saya", result));
        } catch (err: unknown) {
            if (err instanceof AppError) return res.status(err.statusCode).json(sendErrorResponse(err.message));
            return res.status(500).json(sendErrorResponse("Gagal mengambil skill saya"));
        }
    }
}
