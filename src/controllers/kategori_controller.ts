import type { IKategoriService } from "../services/kategori_service.interface.js";
import type { Request, Response } from 'express';
import { sendErrorResponse, sendSuccessfullResponse } from "../utils/response.js";
import { CreateKategoriSchema, UpdateKategoriSchema, KategoriIdParamSchema } from "../dto/kategori.js";
import { AppError } from "../utils/error.js";

export class KategoriController {
    private kategoriService: IKategoriService


    constructor(kategoriService: IKategoriService) {
        this.kategoriService = kategoriService
    }

    async getAll(req: Request, res: Response) {
        try {
            const response = await this.kategoriService.getAll();
            return res.status(200).json(sendSuccessfullResponse("Berhasil mengambil data kategori", response))
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Gagal mengambil data kategori"))
        }
    }

    async getByID(req: Request, res: Response) {
        try {
            const validateParams = KategoriIdParamSchema.safeParse(req.params);
            if (!validateParams.success) {
                const formattedErr = validateParams.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr));
            }
            const kategoriId = validateParams.data.kategori_id;

            const response = await this.kategoriService.getByID(kategoriId);
            if (!response) {
                return res.status(404).json(sendErrorResponse("Data kategori tidak ditemukan"));
            }
            return res.status(200).json(sendSuccessfullResponse("Berhasil mengambil data kategori", response))
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Gagal mengambil data kategori"))
        }
    }

    async create(req: Request, res: Response) {
        try {
            if (!req.body) {
                return res.status(400).json(sendErrorResponse("Request body empty"))
            };

            const validate = CreateKategoriSchema.safeParse(req.body);
            if (!validate.success) {
                const formattedErr = validate.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr))
            }

            const response = await this.kategoriService.create(validate.data);
            return res.status(201).json(sendSuccessfullResponse("Berhasil menambahkan data kategori", response))
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Gagal menambahkan kategori"))
        }
    }

    async update(req: Request, res: Response) {
        try {
            const validateParams = KategoriIdParamSchema.safeParse(req.params);
            if (!validateParams.success) {
                const formattedErr = validateParams.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr));
            }
            const kategoriId = validateParams.data.kategori_id;

            if (!req.body) {
                return res.status(400).json(sendErrorResponse("Request body empty"))
            };

            const validate = UpdateKategoriSchema.safeParse(req.body);
            if (!validate.success) {
                const formattedErr = validate.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr))
            }

            await this.kategoriService.update(kategoriId, validate.data);
            return res.status(200).json(sendSuccessfullResponse("Berhasil mengupdate data kategori"))
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Gagal mengupdate data kategori"))
        }
    }

    async delete(req: Request, res: Response) {
        try {
            const validateParams = KategoriIdParamSchema.safeParse(req.params);
            if (!validateParams.success) {
                const formattedErr = validateParams.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr));
            }
            const kategoriId = validateParams.data.kategori_id;

            await this.kategoriService.delete(kategoriId);
            return res.status(200).json(sendSuccessfullResponse("Berhasil menghapus data kategori"))
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Gagal menghapus kategori"))
        }
    }
}