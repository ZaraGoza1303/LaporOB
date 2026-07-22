import type { Request, Response } from "express";
import { sendErrorResponse, sendSuccessfullResponse } from "../utils/response.js";
import type { IAchievementService } from "../services/achievement_service.interface.js";
import {
    CreateAchievementSchema,
    UpdateAchievementSchema,
    AchievementIdParamSchema,
} from "../dto/achievement.js";
import { AppError } from "../utils/error.js";

export class AchievementController {
    private achievementService: IAchievementService;

    constructor(achievementService: IAchievementService) {
        this.achievementService = achievementService;
    }

    private getUserId(req: Request): string {
        const userId = req.user?.id;
        if (!userId) throw new AppError("User tidak terautentikasi", 401);
        return userId;
    }

    async create(req: Request, res: Response) {
        try {
            if (!req.body) return res.status(400).json(sendErrorResponse("Request body empty"));
            const validate = CreateAchievementSchema.safeParse(req.body);
            if (!validate.success) {
                return res.status(400).json(sendErrorResponse("Validation Failed", validate.error.flatten().fieldErrors));
            }
            const result = await this.achievementService.create(validate.data);
            return res.status(201).json(sendSuccessfullResponse("Berhasil menambahkan achievement", result));
        } catch (err: unknown) {
            if (err instanceof AppError) return res.status(err.statusCode).json(sendErrorResponse(err.message));
            return res.status(500).json(sendErrorResponse("Gagal menambahkan achievement"));
        }
    }

    async getAll(req: Request, res: Response) {
        try {
            const includeInactive = req.query.include_inactive === "true";
            const result = await this.achievementService.getAll(includeInactive);
            return res.status(200).json(sendSuccessfullResponse("Berhasil mengambil daftar achievement", result));
        } catch (err: unknown) {
            if (err instanceof AppError) return res.status(err.statusCode).json(sendErrorResponse(err.message));
            return res.status(500).json(sendErrorResponse("Gagal mengambil daftar achievement"));
        }
    }

    async getByID(req: Request, res: Response) {
        try {
            const validate = AchievementIdParamSchema.safeParse(req.params);
            if (!validate.success) {
                return res.status(400).json(sendErrorResponse("Validation Failed", validate.error.flatten().fieldErrors));
            }
            const result = await this.achievementService.getByID(validate.data.achievement_id);
            if (!result) return res.status(404).json(sendErrorResponse("Achievement tidak ditemukan"));
            return res.status(200).json(sendSuccessfullResponse("Berhasil mengambil achievement", result));
        } catch (err: unknown) {
            if (err instanceof AppError) return res.status(err.statusCode).json(sendErrorResponse(err.message));
            return res.status(500).json(sendErrorResponse("Gagal mengambil achievement"));
        }
    }

    async update(req: Request, res: Response) {
        try {
            const validateParams = AchievementIdParamSchema.safeParse(req.params);
            if (!validateParams.success) {
                return res.status(400).json(sendErrorResponse("Validation Failed", validateParams.error.flatten().fieldErrors));
            }
            if (!req.body) return res.status(400).json(sendErrorResponse("Request body empty"));
            const validateBody = UpdateAchievementSchema.safeParse(req.body);
            if (!validateBody.success) {
                return res.status(400).json(sendErrorResponse("Validation Failed", validateBody.error.flatten().fieldErrors));
            }
            await this.achievementService.update(validateParams.data.achievement_id, validateBody.data);
            return res.status(200).json(sendSuccessfullResponse("Berhasil mengupdate achievement"));
        } catch (err: unknown) {
            if (err instanceof AppError) return res.status(err.statusCode).json(sendErrorResponse(err.message));
            return res.status(500).json(sendErrorResponse("Gagal mengupdate achievement"));
        }
    }

    async delete(req: Request, res: Response) {
        try {
            const validate = AchievementIdParamSchema.safeParse(req.params);
            if (!validate.success) {
                return res.status(400).json(sendErrorResponse("Validation Failed", validate.error.flatten().fieldErrors));
            }
            await this.achievementService.delete(validate.data.achievement_id);
            return res.status(200).json(sendSuccessfullResponse("Berhasil menghapus achievement"));
        } catch (err: unknown) {
            if (err instanceof AppError) return res.status(err.statusCode).json(sendErrorResponse(err.message));
            return res.status(500).json(sendErrorResponse("Gagal menghapus achievement"));
        }
    }

    async getObAchievements(req: Request, res: Response) {
        try {
            const ob_id = req.params.ob_id as string;
            if (!ob_id) return res.status(400).json(sendErrorResponse("ob_id wajib diisi"));
            const result = await this.achievementService.getObAchievements(ob_id);
            return res.status(200).json(sendSuccessfullResponse("Berhasil mengambil achievement OB", result));
        } catch (err: unknown) {
            if (err instanceof AppError) return res.status(err.statusCode).json(sendErrorResponse(err.message));
            return res.status(500).json(sendErrorResponse("Gagal mengambil achievement OB"));
        }
    }

    async getMyAchievements(req: Request, res: Response) {
        try {
            const obId = this.getUserId(req);
            const result = await this.achievementService.getObAchievements(obId);
            return res.status(200).json(sendSuccessfullResponse("Berhasil mengambil achievement saya", result));
        } catch (err: unknown) {
            if (err instanceof AppError) return res.status(err.statusCode).json(sendErrorResponse(err.message));
            return res.status(500).json(sendErrorResponse("Gagal mengambil achievement saya"));
        }
    }
}
