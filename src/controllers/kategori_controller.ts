import type { IKategoriService } from "../services/kategori_service.interface.js";
import type {Request, Response} from 'express';
import { sendErrorResponse, sendSuccessfullResponse } from "../utils/response.js";
import { CreateKategoriSchema, UpdateKategoriSchema } from "../dto/kategori.js";
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
        } catch (err: any) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Gagal mengambil data kategori", err.message))
        }
    }

    async getByID(req: Request, res: Response) {
        try {
            const kategoriId = req.params.kategori_id as string;

            const response = await this.kategoriService.getByID(kategoriId);
            return res.status(200).json(sendSuccessfullResponse("Berhasil mengambil data kategori", response))
        } catch (err: any) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Gagal mengambil data kategori", err.message))
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

            await this.kategoriService.create(validate.data);
            return res.status(201).json(sendSuccessfullResponse("Berhasil menambahkan data kategori"))
        } catch (err: any) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Gagal menambahkan kategori", err.message))
        }
    }

    async update(req: Request, res: Response) {
        try {
            const kategoriId = req.params.kategori_id as string;

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
        } catch (err: any) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Gagal mengupdate data kategori", err.message))
        }
    }

    async delete(req: Request, res: Response) {
        try {
            const kategoriId = req.params.kategori_id as string;

            await this.kategoriService.delete(kategoriId);
            return res.status(200).json(sendSuccessfullResponse("Berhasil menghapus data kategori"))
        } catch (err: any) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Gagal menghapus kategori", err.message))
        }
    }
}