import type { Request, Response } from "express";
import type { IKolaborasiService } from "../services/kolaborasi_service.interface.js";
import { sendSuccessfullResponse, sendErrorResponse } from "../utils/response.js";
import { LaporanIdParams, KolaborasiIdParams } from "../dto/kolaborasi.js";
import { AppError } from "../utils/error.js";

export class KolaborasiController {
    private kolaborasiService: IKolaborasiService;

    constructor(kolaborasiService: IKolaborasiService) {
        this.kolaborasiService = kolaborasiService;
    }

    async gabung(req: Request, res: Response) {
        try {
            const validateParams = LaporanIdParams.safeParse(req.params);
            if (!validateParams.success) {
                const formattedErr = validateParams.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr));
            }
            const laporanId = validateParams.data.laporan_id;
            const obId = req.user?.id as string;

            const result = await this.kolaborasiService.gabung(laporanId, obId);
            return res.status(201).json(sendSuccessfullResponse("Permintaan gabung terkirim", result));
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message));
            }
            return res.status(500).json(sendErrorResponse("Gagal mengirim permintaan gabung"));
        }
    }

    async setujui(req: Request, res: Response) {
        try {
            const validateParams = KolaborasiIdParams.safeParse(req.params);
            if (!validateParams.success) {
                const formattedErr = validateParams.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr));
            }
            const { kolaborasi_id, laporan_id } = validateParams.data;
            const obId = req.user?.id as string;

            await this.kolaborasiService.setujui(kolaborasi_id, laporan_id, obId);
            return res.status(200).json(sendSuccessfullResponse("Permintaan gabung disetujui"));
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message));
            }
            return res.status(500).json(sendErrorResponse("Gagal menyetujui permintaan"));
        }
    }

    async tolak(req: Request, res: Response) {
        try {
            const validateParams = KolaborasiIdParams.safeParse(req.params);
            if (!validateParams.success) {
                const formattedErr = validateParams.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr));
            }
            const { kolaborasi_id, laporan_id } = validateParams.data;
            const obId = req.user?.id as string;

            await this.kolaborasiService.tolak(kolaborasi_id, laporan_id, obId);
            return res.status(200).json(sendSuccessfullResponse("Permintaan gabung ditolak"));
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message));
            }
            return res.status(500).json(sendErrorResponse("Gagal menolak permintaan"));
        }
    }

    async daftarRequest(req: Request, res: Response) {
        try {
            const validateParams = LaporanIdParams.safeParse(req.params);
            if (!validateParams.success) {
                const formattedErr = validateParams.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr));
            }
            const laporanId = validateParams.data.laporan_id;
            const obId = req.user?.id as string;

            const requests = await this.kolaborasiService.daftarRequest(laporanId, obId);
            return res.status(200).json(sendSuccessfullResponse("Daftar permintaan gabung", requests));
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message));
            }
            return res.status(500).json(sendErrorResponse("Gagal mendapatkan daftar permintaan"));
        }
    }
}
