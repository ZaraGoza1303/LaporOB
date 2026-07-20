import type { Request, Response } from 'express';
import { sendErrorResponse, sendSuccessfullResponse } from "../utils/response.js";
import type { IJadwalChecklistService } from "../services/jadwalChecklist_service.interface.js";
import { CreateJadwalChecklistSchema, UpdateJadwalChecklistSchema, JadwalChecklistIdParamSchema } from "../dto/jadwal_checklist.js";
import { AppError } from "../utils/error.js";

export class JadwalChecklistController {
    private jadwalService: IJadwalChecklistService;

    constructor(jadwalService: IJadwalChecklistService) {
        this.jadwalService = jadwalService;
    }

    async getAll(req: Request, res: Response) {
        try {
            const jadwals = await this.jadwalService.getAll();
            return res.status(200).json(sendSuccessfullResponse("Berhasil mengambil daftar jadwal checklist", jadwals));
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message));
            }
            return res.status(500).json(sendErrorResponse("Gagal mengambil daftar jadwal checklist"));
        }
    }

    async create(req: Request, res: Response) {
        try {
            const userId = req.user?.id as string;

            if (!req.body) {
                return res.status(400).json(sendErrorResponse("Request body empty"));
            }

            const validate = CreateJadwalChecklistSchema.safeParse(req.body);
            if (!validate.success) {
                const formattedErr = validate.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr));
            }

            await this.jadwalService.create(userId, validate.data);
            return res.status(201).json(sendSuccessfullResponse("Berhasil menambahkan jadwal checklist"));
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Gagal menambahkan jadwal checklist"));
        }
    }

    async getByID(req: Request, res: Response) {
        try {
            const validateParams = JadwalChecklistIdParamSchema.safeParse(req.params);
            if (!validateParams.success) {
                const formattedErr = validateParams.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr));
            }

            const jadwal = await this.jadwalService.getByID(validateParams.data.jadwal_checklist_id);
            if (!jadwal) {
                return res.status(404).json(sendErrorResponse("Jadwal checklist tidak ditemukan"));
            }

            return res.status(200).json(sendSuccessfullResponse("Berhasil mengambil jadwal checklist", jadwal));
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message));
            }
            return res.status(500).json(sendErrorResponse("Gagal mengambil jadwal checklist"));
        }
    }

    async update(req: Request, res: Response) {
        try {
            const validateParams = JadwalChecklistIdParamSchema.safeParse(req.params);
            if (!validateParams.success) {
                const formattedErr = validateParams.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr));
            }

            if (!req.body) {
                return res.status(400).json(sendErrorResponse("Request body empty"));
            }

            const validate = UpdateJadwalChecklistSchema.safeParse(req.body);
            if (!validate.success) {
                const formattedErr = validate.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr));
            }

            await this.jadwalService.update(validateParams.data.jadwal_checklist_id, validate.data);
            return res.status(200).json(sendSuccessfullResponse("Berhasil mengupdate jadwal checklist"));
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message));
            }
            return res.status(500).json(sendErrorResponse("Gagal mengupdate jadwal checklist"));
        }
    }

    async delete(req: Request, res: Response) {
        try {
            const validateParams = JadwalChecklistIdParamSchema.safeParse(req.params);
            if (!validateParams.success) {
                const formattedErr = validateParams.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr));
            }

            await this.jadwalService.delete(validateParams.data.jadwal_checklist_id);
            return res.status(200).json(sendSuccessfullResponse("Berhasil menghapus jadwal checklist"));
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message));
            }
            return res.status(500).json(sendErrorResponse("Gagal menghapus jadwal checklist"));
        }
    }
}
