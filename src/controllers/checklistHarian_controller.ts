import type { Request, Response } from 'express';
import { sendErrorResponse, sendSuccessfullResponse } from "../utils/response.js";
import type { IChecklistHarianService } from "../services/checklistHarian_service.interface.js";
import { ChecklistHarianQuerySchema, UpdateChecklistHarianSchema, ChecklistHarianIdParamSchema } from "../dto/checklist_harian.js";
import { AppError } from "../utils/error.js";

export class ChecklistHarianController {
    private checklistService: IChecklistHarianService;

    constructor(checklistService: IChecklistHarianService) {
        this.checklistService = checklistService;
    }

    async getAll(req: Request, res: Response) {
        try {
            const page = parseInt(String(req.query.page)) || 1;
            const limit = parseInt(String(req.query.limit)) || 10;

            const validate = ChecklistHarianQuerySchema.safeParse(req.query);
            if (!validate.success) {
                const formattedErr = validate.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr));
            }

            const response = await this.checklistService.getAll(page, limit, validate.data);
            return res.status(200).json(sendSuccessfullResponse("Berhasil mengambil data checklist harian", response));
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Gagal mengambil data checklist harian"));
        }
    }

    async getByID(req: Request, res: Response) {
        try {
            const validateParams = ChecklistHarianIdParamSchema.safeParse(req.params);
            if (!validateParams.success) {
                const formattedErr = validateParams.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr));
            }
            const checklistId = validateParams.data.checklist_harian_id;
            const response = await this.checklistService.getByID(checklistId);

            if (!response) {
                return res.status(404).json(sendErrorResponse("Data checklist harian tidak ditemukan"));
            }

            return res.status(200).json(sendSuccessfullResponse("Berhasil mengambil data checklist harian", response));
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Gagal mengambil data checklist harian"));
        }
    }

    async update(req: Request, res: Response) {
        try {
            const validateParams = ChecklistHarianIdParamSchema.safeParse(req.params);
            if (!validateParams.success) {
                const formattedErr = validateParams.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr));
            }
            const checklistId = validateParams.data.checklist_harian_id;

            if (!req.body) {
                return res.status(400).json(sendErrorResponse("Request body empty"));
            }

            const validate = UpdateChecklistHarianSchema.safeParse(req.body);
            if (!validate.success) {
                const formattedErr = validate.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr));
            }

            await this.checklistService.update(checklistId, validate.data);
            return res.status(200).json(sendSuccessfullResponse("Berhasil mengupdate data checklist harian"));
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Gagal mengupdate data checklist harian"));
        }
    }

    async delete(req: Request, res: Response) {
        try {
            const validateParams = ChecklistHarianIdParamSchema.safeParse(req.params);
            if (!validateParams.success) {
                const formattedErr = validateParams.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr));
            }
            const checklistId = validateParams.data.checklist_harian_id;

            await this.checklistService.delete(checklistId);
            return res.status(200).json(sendSuccessfullResponse("Berhasil menghapus data checklist harian"));
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Gagal menghapus checklist harian"));
        }
    }
}
