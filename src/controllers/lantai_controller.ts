import type { ILantaiService } from "../services/lantai_service.interface.js";
import type { Request, Response } from 'express';
import { sendErrorResponse, sendSuccessfullResponse } from "../utils/response.js";
import { CreateLantaiSchema, UpdateLantaiSchema, LantaiIdParamSchema, LantaiQuerySchema } from "../dto/lantai.js";
import { AppError } from "../utils/error.js";

export class LantaiController {
    private lantaiService: ILantaiService;

    constructor(lantaiService: ILantaiService) {
        this.lantaiService = lantaiService;
    }

    async getAll(req: Request, res: Response) {
        try {
            const validateQuery = LantaiQuerySchema.safeParse(req.query);
            if (!validateQuery.success) {
                const formattedErr = validateQuery.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr));
            }
            const lokasiId = validateQuery.data.lokasi_id;

            const response = await this.lantaiService.getAll(lokasiId);
            return res.status(200).json(sendSuccessfullResponse("Berhasil mengambil data lantai", response));
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Gagal mengambil data lantai"));
        }
    }

    async getByID(req: Request, res: Response) {
        try {
            const validateParams = LantaiIdParamSchema.safeParse(req.params);
            if (!validateParams.success) {
                const formattedErr = validateParams.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr));
            }
            const lantaiId = validateParams.data.lantai_id;

            const validateQuery = LantaiQuerySchema.safeParse(req.query);
            if (!validateQuery.success) {
                const formattedErr = validateQuery.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr));
            }
            const lokasiId = validateQuery.data.lokasi_id;

            const response = await this.lantaiService.getById(lokasiId, lantaiId);

            if (!response) {
                return res.status(404).json(sendErrorResponse("Data lantai tidak ditemukan"));
            }

            return res.status(200).json(sendSuccessfullResponse("Berhasil mengambil data lantai", response));
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Gagal mengambil data lantai"));
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

            const response = await this.lantaiService.create(validate.data);
            return res.status(201).json(sendSuccessfullResponse("Berhasil menambahkan data lantai", response));
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Gagal menambahkan lantai"));
        }
    }

    async update(req: Request, res: Response) {
        try {
            const validateParams = LantaiIdParamSchema.safeParse(req.params);
            if (!validateParams.success) {
                const formattedErr = validateParams.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr));
            }
            const lantaiId = validateParams.data.lantai_id;

            const validateQuery = LantaiQuerySchema.safeParse(req.query);
            if (!validateQuery.success) {
                const formattedErr = validateQuery.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr));
            }
            const lokasiId = validateQuery.data.lokasi_id;

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
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Gagal mengupdate data lantai"));
        }
    }

    async delete(req: Request, res: Response) {
        try {
            const validateParams = LantaiIdParamSchema.safeParse(req.params);
            if (!validateParams.success) {
                const formattedErr = validateParams.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr));
            }
            const lantaiId = validateParams.data.lantai_id;

            const validateQuery = LantaiQuerySchema.safeParse(req.query);
            if (!validateQuery.success) {
                const formattedErr = validateQuery.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr));
            }
            const lokasiId = validateQuery.data.lokasi_id;

            await this.lantaiService.delete(lokasiId, lantaiId);
            return res.status(200).json(sendSuccessfullResponse("Berhasil menghapus data lantai"));
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Gagal menghapus lantai"));
        }
    }
}
