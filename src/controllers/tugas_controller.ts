import type { ITugasService } from "../services/tugas_service.interface.js";
import type { Request, Response } from 'express';
import { sendErrorResponse, sendSuccessfullResponse } from "../utils/response.js";
import { CreateTugasSchema, TugasQuerySchema, UpdateTugasSchema, TugasIdParamSchema } from "../dto/tugas.js";
import { AppError } from "../utils/error.js";

export class TugasController {
    private tugasService: ITugasService


    constructor(tugasService: ITugasService) {
        this.tugasService = tugasService
    }

    async getAll(req: Request, res: Response) {
        try {
            const validate = TugasQuerySchema.safeParse(req.query);
            if (!validate.success) {
                const formattedErr = validate.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr))
            }

            const response = await this.tugasService.getAll(validate.data.kategori_id);
            return res.status(200).json(sendSuccessfullResponse("Berhasil mengambil data tugas", response))
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Gagal mengambil data tugas"))
        }
    }

    async getByID(req: Request, res: Response) {
        try {
            const validateParams = TugasIdParamSchema.safeParse(req.params);
            if (!validateParams.success) {
                const formattedErr = validateParams.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr));
            }
            const tugasId = validateParams.data.tugas_id;

            const response = await this.tugasService.getDetailByID(tugasId);
            if (!response) {
                return res.status(404).json(sendErrorResponse("Data tugas tidak ditemukan"));
            }
            return res.status(200).json(sendSuccessfullResponse("Berhasil mengambil data tugas", response))
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Gagal mengambil data tugas"))
        }
    }

    async create(req: Request, res: Response) {
        try {
            if (!req.body) {
                return res.status(400).json(sendErrorResponse("Request body empty"))
            };

            const validate = CreateTugasSchema.safeParse(req.body);
            if (!validate.success) {
                const formattedErr = validate.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr))
            }

            const response = await this.tugasService.create(validate.data);
            return res.status(201).json(sendSuccessfullResponse("Berhasil menambahkan data tugas", response))
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Gagal menambahkan tugas"))
        }
    }

    async update(req: Request, res: Response) {
        try {
            const validateParams = TugasIdParamSchema.safeParse(req.params);
            if (!validateParams.success) {
                const formattedErr = validateParams.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr));
            }
            const tugasId = validateParams.data.tugas_id;

            if (!req.body) {
                return res.status(400).json(sendErrorResponse("Request body empty"))
            };

            const validate = UpdateTugasSchema.safeParse(req.body);
            if (!validate.success) {
                const formattedErr = validate.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr))
            }

            await this.tugasService.update(tugasId, validate.data);
            return res.status(200).json(sendSuccessfullResponse("Berhasil mengupdate data tugas"))
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Gagal mengupdate data tugas"))
        }
    }

    async delete(req: Request, res: Response) {
        try {
            const validateParams = TugasIdParamSchema.safeParse(req.params);
            if (!validateParams.success) {
                const formattedErr = validateParams.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr));
            }
            const tugasId = validateParams.data.tugas_id;

            await this.tugasService.delete(tugasId);
            return res.status(200).json(sendSuccessfullResponse("Berhasil menghapus data tugas"))
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Gagal menghapus tugas"))
        }
    }
}
