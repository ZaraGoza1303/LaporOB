import type { IRuanganService } from "../services/ruangan_service.interface.js";
import type { Request, Response } from 'express';
import { sendErrorResponse, sendSuccessfullResponse } from "../utils/response.js";
import { CreateRuanganSchema, UpdateRuanganSchema } from "../dto/ruangan.js";
import { AppError } from "../utils/error.js";

export class RuanganController {
    private ruanganService: IRuanganService;

    constructor(ruanganService: IRuanganService) {
        this.ruanganService = ruanganService;
    }

    async getAll(req: Request, res: Response) {
        try {
            const lantaiId = req.query.lantai_id as string;

            if (!lantaiId) {
                return res.status(400).json(sendErrorResponse("Parameter query lantai_id wajib diisi"));
            }

            const response = await this.ruanganService.getAll(lantaiId);
            return res.status(200).json(sendSuccessfullResponse("Berhasil mengambil data ruangan", response));
        } catch (err: any) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Gagal mengambil data ruangan", err.message));
        }
    }

    async getByID(req: Request, res: Response) {
        try {
            const ruanganId = req.params.ruangan_id as string;
            const lantaiId = req.query.lantai_id as string;

            if (!lantaiId) {
                return res.status(400).json(sendErrorResponse("Parameter query lantai_id wajib diisi"));
            }

            const response = await this.ruanganService.getById(lantaiId, ruanganId);

            if (!response) {
                return res.status(404).json(sendErrorResponse("Data ruangan tidak ditemukan"));
            }

            return res.status(200).json(sendSuccessfullResponse("Berhasil mengambil data ruangan", response));
        } catch (err: any) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Gagal mengambil data ruangan", err.message));
        }
    }

    async create(req: Request, res: Response) {
        try {
            if (!req.body) {
                return res.status(400).json(sendErrorResponse("Request body empty"));
            }

            const validate = CreateRuanganSchema.safeParse(req.body);
            if (!validate.success) {
                const formattedErr = validate.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr));
            }

            await this.ruanganService.create(validate.data);
            return res.status(201).json(sendSuccessfullResponse("Berhasil menambahkan data ruangan"));
        } catch (err: any) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Gagal menambahkan ruangan", err.message));
        }
    }

    async update(req: Request, res: Response) {
        try {
            const ruanganId = req.params.ruangan_id as string;
            const lantaiId = req.query.lantai_id as string;

            if (!lantaiId) {
                return res.status(400).json(sendErrorResponse("Parameter query lantai_id wajib diisi"));
            }

            if (!req.body) {
                return res.status(400).json(sendErrorResponse("Request body empty"));
            }

            const validate = UpdateRuanganSchema.safeParse(req.body);
            if (!validate.success) {
                const formattedErr = validate.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr));
            }

            await this.ruanganService.update(lantaiId, ruanganId, validate.data);
            return res.status(200).json(sendSuccessfullResponse("Berhasil mengupdate data ruangan"));
        } catch (err: any) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Gagal mengupdate data ruangan", err.message));
        }
    }

    async delete(req: Request, res: Response) {
        try {
            const ruanganId = req.params.ruangan_id as string;
            const lantaiId = req.query.lantai_id as string;

            if (!lantaiId) {
                return res.status(400).json(sendErrorResponse("Parameter query lantai_id wajib diisi"));
            }

            await this.ruanganService.delete(lantaiId, ruanganId);
            return res.status(200).json(sendSuccessfullResponse("Berhasil menghapus data ruangan"));
        } catch (err: any) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Gagal menghapus ruangan", err.message));
        }
    }
}
