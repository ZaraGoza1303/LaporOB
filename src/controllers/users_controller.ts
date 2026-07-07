import type { IUsersService } from "../services/users_service.interface.js";
import type { IKaryawanService } from "../services/karyawan_service.interface.js";
import type { IObService } from "../services/ob_service.interface.js";
import type { ILaporanService } from "../services/laporan_service.interface.js";
import { ProfileLaporanQuerySchema } from "../dto/users.js";
import { sendErrorResponse, sendSuccessfullResponse } from "../utils/response.js";
import type { Request, Response } from "express";
import { AppError } from "../utils/error.js";

export class UsersController {
    private usersService: IUsersService;
    private karyawanService: IKaryawanService;
    private obService: IObService;
    private laporanService: ILaporanService;

    constructor(
        usersService: IUsersService,
        karyawanService: IKaryawanService,
        obService: IObService,
        laporanService: ILaporanService
    ) {
        this.usersService = usersService;
        this.karyawanService = karyawanService;
        this.obService = obService;
        this.laporanService = laporanService;
    }

    async getProfile(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            const role = req.user?.role;

            if (!userId || !role) {
                res.status(401).json(sendErrorResponse("Unauthorized: ID user atau role tidak ditemukan dalam token"));
                return;
            }

            const validate = ProfileLaporanQuerySchema.safeParse(req.query);
            if (!validate.success) {
                const formatedErr = validate.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formatedErr));
            }

            const { search, status, cursor, limit } = validate.data;

            const userProfile = await this.usersService.getProfile(userId);

            const laporan = role.toLowerCase() === "ob"
                ? await this.obService.getRiwayat(userId, limit, { cursor, search, status })
                : await this.karyawanService.getRiwayat(userId, limit, { cursor, search, status });

            return res.status(200).json(sendSuccessfullResponse("Berhasil mendapatkan data profile", {
                user: userProfile,
                laporan
            }));
        } catch (err: any) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Terjadi kesalahan pada server", err.message));
        }
    }

    async getReportDetail(req: Request, res: Response) {
        try {
            const reportId = req.params.report_id as string;
            const response = await this.laporanService.getReportDetail(reportId);
            return res.status(200).json(sendSuccessfullResponse("Berhasil mendapatkan detail laporan", response));
        } catch (err: any) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Terjadi kesalahan pada server", err.message));
        }
    }
}
