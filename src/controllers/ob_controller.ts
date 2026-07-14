import type { Request, Response } from "express";
import type { IObService } from "../services/ob_service.interface.js";
import { sendSuccessfullResponse, sendErrorResponse } from "../utils/response.js";
import type { IStorageService } from "../services/storage_service.interface.js";
import { CreateHistoriSchema, ChecklistIdParamSchema } from "../dto/ob.js";
import { LaporanIdParamSchema } from "../dto/users.js";
import { compressImageIfNeeded, validateImageFile } from "../utils/validate_file.js";
import { AppError } from "../utils/error.js";

export class ObController {
    private obService: IObService;
    private storageService: IStorageService;

    constructor(obService: IObService, storageService: IStorageService) {
        this.obService = obService;
        this.storageService = storageService;
    }

    async getHomeStats(req: Request, res: Response) {
        try {
            const obId = req.user?.id as string;

            const response = await this.obService.getHomeStats(obId);
            return res.status(200).json(sendSuccessfullResponse("Berhasil mendapatkan data home OB", response));
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(400).json(sendErrorResponse("Gagal mendapatkan data dashboard OB", err instanceof Error ? err.message : "Unknown error"));
        }
    }


    async takeLapor(req: Request, res: Response) {
        try {
            const validateParams = LaporanIdParamSchema.safeParse(req.params);
            if (!validateParams.success) {
                const formattedErr = validateParams.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr));
            }
            const laporanId = validateParams.data.laporan_id;
            const obId = req.user?.id as string;

            await this.obService.ambilLaporan(laporanId, obId);

            return res.status(200).json(sendSuccessfullResponse("Laporan berhasil diambil"));
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Terjadi kesalahan, tidak bisa mengambil laporan"))
        }
    }

    async submitHistori(req: Request, res: Response) {
        try {
            const validateParams = LaporanIdParamSchema.safeParse(req.params);
            if (!validateParams.success) {
                const formattedErr = validateParams.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr));
            }
            const laporanId = validateParams.data.laporan_id;
            const obId = req.user?.id as string;

            const validate = CreateHistoriSchema.safeParse(req.body);

            if (!validate.success) {
                const formatedErr = validate.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation failed", formatedErr));
            }

            const fotoFiles = (req.files as Express.Multer.File[]).filter(
                (file) => file.fieldname === "foto_selesai"
            );

            if (fotoFiles.length === 0) {
                return res.status(400).json(sendErrorResponse("Foto selesai wajib diupload"));
            }

            const fotoUrls: string[] = [];
            for (const file of fotoFiles) {
                const validation = await validateImageFile(file);
                if (!validation.ok) {
                    return res.status(400).json(sendErrorResponse(validation.message));
                }

                try {
                    await compressImageIfNeeded(file);
                } catch (err: unknown) {
                    return res.status(500).json(sendErrorResponse("Gagal memproses gambar", err instanceof Error ? err.message : "Unknown error"));
                }

                const url = await this.storageService.uploadFile(file);
                fotoUrls.push(url);
            }

            await this.obService.createHistoriPekerjaan(laporanId, fotoUrls, validate.data, obId);

            return res.status(200).json(sendSuccessfullResponse("Histori pekerjaan berhasil disimpan"));
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Terjadi kesalahan, tidak bisa menyimpan histori pekerjaan"))
        }
    }

    async rejectLapor(req: Request, res: Response) {
        try {
            const validateParams = LaporanIdParamSchema.safeParse(req.params);
            if (!validateParams.success) {
                const formattedErr = validateParams.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr));
            }
            const laporanId = validateParams.data.laporan_id;
            const obId = req.user?.id as string;

            const validate = CreateHistoriSchema.safeParse(req.body);

            if (!validate.success) {
                const formatedErr = validate.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validasi Gagal", formatedErr));
            }

            const fotoFiles = (req.files as Express.Multer.File[]).filter(
                (file) => file.fieldname === "foto_selesai"
            );

            if (fotoFiles.length === 0) {
                return res.status(400).json(sendErrorResponse("Foto bukti penolakan wajib diupload"));
            }

            const fotoUrls: string[] = [];
            for (const file of fotoFiles) {
                const validation = await validateImageFile(file);
                if (!validation.ok) {
                    return res.status(400).json(sendErrorResponse(validation.message));
                }

                try {
                    await compressImageIfNeeded(file);
                } catch (err: unknown) {
                    return res.status(500).json(sendErrorResponse("Gagal memproses gambar", err instanceof Error ? err.message : "Unknown error"));
                }

                const url = await this.storageService.uploadFile(file);
                fotoUrls.push(url);
            }

            await this.obService.tolakLaporan(laporanId, fotoUrls, validate.data, obId);

            return res.status(200).json(sendSuccessfullResponse("Laporan berhasil dibatalkan dan bukti disimpan"));
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Terjadi kesalahan, tidak bisa menolak laporan"))
        }
    }

    async claimChecklist(req: Request, res: Response) {
        try {
            const validateParams = ChecklistIdParamSchema.safeParse(req.params);
            if (!validateParams.success) {
                const formattedErr = validateParams.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr));
            }

            const checklistId = validateParams.data.checklist_id;
            const obId = req.user?.id as string;

            await this.obService.ambilChecklist(checklistId, obId);

            return res.status(200).json(sendSuccessfullResponse("Checklist berhasil diklaim"));
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message));
            }
            return res.status(500).json(sendErrorResponse("Terjadi kesalahan, tidak bisa mengklaim checklist"));
        }
    }
}