import type { ILokasiService } from "../services/lokasi_service.interface.js";
import type { Request, Response } from 'express';
import { sendErrorResponse, sendSuccessfullResponse } from "../utils/response.js";
import { CreateLokasiSchema, UpdateLokasiSchema, LokasiIdParamSchema } from "../dto/lokasi.js";
import { AppError } from "../utils/error.js";

export class LokasiController {
    private lokasiService: ILokasiService;

    constructor(lokasiService: ILokasiService) {
        this.lokasiService = lokasiService;
    }

    async getAll(req: Request, res: Response) {
        try {
            const response = await this.lokasiService.getAll();
            return res.status(200).json(sendSuccessfullResponse("Berhasil mengambil data lokasi", response));
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Gagal mengambil data lokasi"));
        }
    }

    async getByID(req: Request, res: Response) {
        try {
            const validateParams = LokasiIdParamSchema.safeParse(req.params);
            if (!validateParams.success) {
                const formattedErr = validateParams.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr));
            }
            const lokasiId = validateParams.data.lokasi_id;
            const response = await this.lokasiService.getByID(lokasiId);

            if (!response) {
                return res.status(404).json(sendErrorResponse("Data lokasi tidak ditemukan"));
            }

            return res.status(200).json(sendSuccessfullResponse("Berhasil mengambil data lokasi", response));
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Gagal mengambil data lokasi"));
        }
    }

    async create(req: Request, res: Response) {
        try {
            if (!req.body) {
                return res.status(400).json(sendErrorResponse("Request body empty"));
            }

            const validate = CreateLokasiSchema.safeParse(req.body);
            if (!validate.success) {
                const formattedErr = validate.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr));
            }

            const response = await this.lokasiService.create(validate.data);
            return res.status(201).json(sendSuccessfullResponse("Berhasil menambahkan data lokasi", response));
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Gagal menambahkan lokasi"));
        }
    }

    async update(req: Request, res: Response) {
        try {
            const validateParams = LokasiIdParamSchema.safeParse(req.params);
            if (!validateParams.success) {
                const formattedErr = validateParams.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr));
            }
            const lokasiId = validateParams.data.lokasi_id;

            if (!req.body) {
                return res.status(400).json(sendErrorResponse("Request body empty"));
            }

            const validate = UpdateLokasiSchema.safeParse(req.body);
            if (!validate.success) {
                const formattedErr = validate.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr));
            }

            await this.lokasiService.update(lokasiId, validate.data);
            return res.status(200).json(sendSuccessfullResponse("Berhasil mengupdate data lokasi"));
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Gagal mengupdate data lokasi"));
        }
    }

    async delete(req: Request, res: Response) {
        try {
            const validateParams = LokasiIdParamSchema.safeParse(req.params);
            if (!validateParams.success) {
                const formattedErr = validateParams.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr));
            }
            const lokasiId = validateParams.data.lokasi_id;

            await this.lokasiService.delete(lokasiId);
            return res.status(200).json(sendSuccessfullResponse("Berhasil menghapus data lokasi"));
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Gagal menghapus lokasi"));
        }
    }
}
