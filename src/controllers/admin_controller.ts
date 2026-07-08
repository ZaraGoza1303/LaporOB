import { AdminLaporanQuerySchema, GetDashboardQuerySchema } from '../dto/admin.js';
import type { IAdminService } from "../services/admin_service.interface.js";
import { sendErrorResponse, sendSuccessfullResponse } from "../utils/response.js";
import type { Request, Response } from "express";
import { AppError } from "../utils/error.js";

export class AdminController {
    private adminService: IAdminService;

    constructor(adminService: IAdminService) {
        this.adminService = adminService;
    }
    
    async getDashboardData(req: Request, res: Response) {
        try {
            const parsedQuery = GetDashboardQuerySchema.parse(req.query);

            const dashboardData = await this.adminService.getDashboardData(parsedQuery);

            return res.status(200).json(
                sendSuccessfullResponse("Berhasil mengambil data dashboard admin", dashboardData)
            );
        } catch (err: any) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message));
            }
            return res.status(500).json(sendErrorResponse("Gagal mengambil data dashboard admin", err.message));
        }
    }

    async getAllLaporan(req: Request, res: Response) {
        try {
            const page = parseInt(String(req.query.page), 10) || 1;
            const limit = parseInt(String(req.query.limit), 10) || 10;

            const validate = AdminLaporanQuerySchema.safeParse(req.query);
            if (!validate.success) {
                const formatedErr = validate.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formatedErr));
            }

            const response = await this.adminService.getAllLaporan(page, limit, validate.data);
            return res.status(200).json(sendSuccessfullResponse("Berhasil mendapatkan data laporan pengguna", response));
        } catch (err: any) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message));
            }
            return res.status(500).json(sendErrorResponse("Gagal mendapatkan data laporan pengguna", err.message));
        }
    }

    async getReportDetail(req: Request, res: Response) {
        try {
            const laporanId = req.params.laporan_id as string;

            const response = await this.adminService.getReportDetail(laporanId);
            return res.status(200).json(sendSuccessfullResponse("Berhasil mendapatkan detail laporan", response));
        } catch (err: any) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message));
            }
            return res.status(500).json(sendErrorResponse("Gagal mendapatkan detail laporan", err.message));
        }
    }

    async getUserStats(req: Request, res: Response) {
       try {
            const response = await this.adminService.getUserStats()
            return res.status(200).json(sendSuccessfullResponse("Berhasil mendapatkan data", response));
        } catch (err: any) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Gagal mendapatkan data", err.message))
        }
    }
}
