import { CreateLaporanKaryawanSchema } from "../dto/users.js";
import type { IKaryawanService } from "../services/karyawan_service.interface.js";
import { sendErrorResponse, sendSuccessfullResponse } from "../utils/response.js";
import type { Request, Response } from "express";
import { processImageFile } from "../utils/validate_file.js";
import type { IStorageService } from "../services/storage_service.interface.js";
import { AppError } from "../utils/error.js";

export class KaryawanController {
    private karyawanService: IKaryawanService;
    private storageService: IStorageService;

    constructor(karyawanService: IKaryawanService, storageService: IStorageService) {
        this.karyawanService = karyawanService;
        this.storageService = storageService;
    }

    async getHomeStats(req: Request, res: Response) {
        try {
            const userId = req.user?.id as string;

            const response = await this.karyawanService.getHomeStats(userId)
            return res.status(200).json(sendSuccessfullResponse("Berhasil mendapatkan data home karyawan", response));
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Gagal mendapatkan data home karyawan"))
        }
    }

    async createReport(req: Request, res: Response) {
        try {
            const userId = req.user?.id as string;

            if (!req.body) {
                return res.status(400).json(sendErrorResponse("Request body empty"))
            };

            const validate = CreateLaporanKaryawanSchema.safeParse(req.body);
            if (!validate.success) {
                const formatedErr = validate.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formatedErr));
            }

            const fotoFiles = (req.files as Express.Multer.File[]).filter(
                (file) => file.fieldname === "foto_masalah"
            );

            if (fotoFiles.length === 0) {
                return res.status(400).json(sendErrorResponse("Foto masalah wajib diupload"));
            }

            // Validasi SEMUA file dulu, baru upload
            for (const file of fotoFiles) {
                const processed = await processImageFile(file);
                if (!processed.ok) {
                    return res.status(processed.status).json(sendErrorResponse(processed.message));
                }
            }

            const fotoUrls: string[] = [];
            for (const file of fotoFiles) {
                const processed = await processImageFile(file);
                if (!processed.ok) {
                    return res.status(processed.status).json(sendErrorResponse(processed.message));
                }

                const url = await this.storageService.uploadFile(file);
                fotoUrls.push(url);
            }

            const response = await this.karyawanService.createReport(userId, {
                ...validate.data,
                foto_masalah: fotoUrls,
            })

            return res.status(201).json(sendSuccessfullResponse("Berhasil menambahkan data laporan", response));
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Gagal menambahkan data laporan"))
        }
    }
}
