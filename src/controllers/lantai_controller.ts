import type { ILantaiService } from "../services/lantai_service.interface.js";
import type { Request, Response } from 'express';
import { sendErrorResponse, sendSuccessfullResponse } from "../utils/response.js";
import { CreateLantaiSchema, UpdateLantaiSchema } from "../dto/lantai.js";
import { AppError } from "../utils/error.js";

export class LantaiController {
    private lantaiService: ILantaiService;

    constructor(lantaiService: ILantaiService) {
        this.lantaiService = lantaiService;
    }

    async getAll(req: Request, res: Response) {
        try {
            const lokasiId = req.query.lokasi_id as string;

            if (!lokasiId) {
                return res.status(400).json(sendErrorResponse("Parameter query lokasi_id wajib diisi"));
            }

            const response = await this.lantaiService.getAll(lokasiId);
            return res.status(200).json(sendSuccessfullResponse("Berhasil mengambil data lantai", response));
        } catch (err: any) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Gagal mengambil data lantai", err.message));
        }
    }

    async getByID(req: Request, res: Response) {
        try {
            const lantaiId = req.params.lantai_id as string;
            const lokasiId = req.query.lokasi_id as string;

            if (!lokasiId) {
                return res.status(400).json(sendErrorResponse("Parameter query lokasi_id wajib diisi"));
            }

            const response = await this.lantaiService.getById(lokasiId, lantaiId);

            if (!response) {
                return res.status(404).json(sendErrorResponse("Data lantai tidak ditemukan"));
            }

            return res.status(200).json(sendSuccessfullResponse("Berhasil mengambil data lantai", response));
        } catch (err: any) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Gagal mengambil data lantai", err.message));
        }
    }

    async create(req: Request, res: Response) {
        try {
            if (!req.body) {
                return res.status(400).json(sendErrorResponse("Request body empty"));
            }

            const validate = CreateLantaiSchema.safeParse(req.body);
            if (!validate.success) {
                const formattedErr = validate.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr));
            }

            await this.lantaiService.create(validate.data);
            return res.status(201).json(sendSuccessfullResponse("Berhasil menambahkan data lantai"));
        } catch (err: any) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Gagal menambahkan lantai", err.message));
        }
    }

    async update(req: Request, res: Response) {
        try {
            const lantaiId = req.params.lantai_id as string;
            const lokasiId = req.query.lokasi_id as string;

            if (!lokasiId) {
                return res.status(400).json(sendErrorResponse("Parameter query lokasi_id wajib diisi"));
            }

            if (!req.body) {
                return res.status(400).json(sendErrorResponse("Request body empty"));
            }

            const validate = UpdateLantaiSchema.safeParse(req.body);
            if (!validate.success) {
                const formattedErr = validate.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr));
            }

            await this.lantaiService.update(lokasiId, lantaiId, validate.data);
            return res.status(200).json(sendSuccessfullResponse("Berhasil mengupdate data lantai"));
        } catch (err: any) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Gagal mengupdate data lantai", err.message));
        }
    }

    async delete(req: Request, res: Response) {
        try {
            const lantaiId = req.params.lantai_id as string;
            const lokasiId = req.query.lokasi_id as string;

            if (!lokasiId) {
                return res.status(400).json(sendErrorResponse("Parameter query lokasi_id wajib diisi"));
            }

            await this.lantaiService.delete(lokasiId, lantaiId);
            return res.status(200).json(sendSuccessfullResponse("Berhasil menghapus data lantai"));
        } catch (err: any) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Gagal menghapus lantai", err.message));
        }
    }
}
