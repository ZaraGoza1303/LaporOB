import type { Request, Response } from 'express';
import { sendErrorResponse, sendSuccessfullResponse } from "../utils/response.js";
import type { IChecklistHarianService } from "../services/checklistHarian_service.interface.js";
import { CreateChecklistHarianSchema, UpdateChecklistHarianSchema, type ChecklistHarianQuery } from "../dto/checklist_harian.js";

export class ChecklistHarianController {
    private checklistService: IChecklistHarianService;

    constructor(checklistService: IChecklistHarianService) {
        this.checklistService = checklistService;
    }

    async getAll(req: Request, res: Response) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const query: ChecklistHarianQuery = {
                search: (req.query.search as string) ?? null,
                lokasi_id: (req.query.lokasi_id as string) ?? null,
                lantai_id: (req.query.lantai_id as string) ?? null,
                status: (req.query.status as string) ?? null,
            };

            const response = await this.checklistService.getAll(page, limit, query);
            return res.status(200).json(sendSuccessfullResponse("Berhasil mengambil data checklist harian", response));
        } catch (err: any) {
            return res.status(500).json(sendErrorResponse("Gagal mengambil data checklist harian", err.message));
        }
    }

    async getByID(req: Request, res: Response) {
        try {
            const checklistId = req.params.checklist_harian_id as string;
            const response = await this.checklistService.getByID(checklistId);

            if (!response) {
                return res.status(404).json(sendErrorResponse("Data checklist harian tidak ditemukan"));
            }

            return res.status(200).json(sendSuccessfullResponse("Berhasil mengambil data checklist harian", response));
        } catch (err: any) {
            return res.status(500).json(sendErrorResponse("Gagal mengambil data checklist harian", err.message));
        }
    }

    async create(req: Request, res: Response) {
        try {
            if (!req.body) {
                return res.status(400).json(sendErrorResponse("Request body empty"));
            }

            const validate = CreateChecklistHarianSchema.safeParse(req.body);
            if (!validate.success) {
                const formattedErr = validate.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr));
            }

            await this.checklistService.create(validate.data);
            return res.status(201).json(sendSuccessfullResponse("Berhasil menambahkan data checklist harian"));
        } catch (err: any) {
            return res.status(500).json(sendErrorResponse("Gagal menambahkan checklist harian", err.message));
        }
    }

    async update(req: Request, res: Response) {
        try {
            const checklistId = req.params.checklist_harian_id as string;

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
        } catch (err: any) {
            return res.status(500).json(sendErrorResponse("Gagal mengupdate data checklist harian", err.message));
        }
    }

    async delete(req: Request, res: Response) {
        try {
            const checklistId = req.params.checklist_harian_id as string;

            await this.checklistService.delete(checklistId);
            return res.status(200).json(sendSuccessfullResponse("Berhasil menghapus data checklist harian"));
        } catch (err: any) {
            return res.status(500).json(sendErrorResponse("Gagal menghapus checklist harian", err.message));
        }
    }
}
