
import { AdminLaporanQuerySchema, AssignObToLocationsSchema, GetDashboardQuerySchema, PatchLaporanReqSchema } from '../dto/admin.js';
import { LaporanIdParamSchema } from '../dto/users.js';
import type { IAdminService } from "../services/admin_service.interface.js";
import { sendErrorResponse, sendSuccessfullResponse } from "../utils/response.js";
import type { Request, Response } from "express";
import { AppError } from "../utils/error.js";
import { z } from "zod";

export class AdminController {
    private adminService: IAdminService;

    constructor(adminService: IAdminService) {
        this.adminService = adminService;
    }

    async getDashboardData(req: Request, res: Response) {
        try {
            const parsedQuery = GetDashboardQuerySchema.safeParse(req.query);
            if (!parsedQuery.success) {
                const formattedErr = parsedQuery.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr));
            }

            const dashboardData = await this.adminService.getDashboardData(parsedQuery.data);

            return res.status(200).json(
                sendSuccessfullResponse("Berhasil mengambil data dashboard admin", dashboardData)
            );
        } catch (err: any) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message));
            }
            return res.status(500).json(sendErrorResponse("Gagal mengambil data dashboard admin"));
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
            const validateParams = LaporanIdParamSchema.safeParse(req.params);
            if (!validateParams.success) {
                const formattedErr = validateParams.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr));
            }
            const laporanId = validateParams.data.laporan_id;

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


  async patchLaporan(req: Request, res: Response) {
        try {
            const validateParams = LaporanIdParamSchema.safeParse(req.params);
            if (!validateParams.success) {
                const formattedErr = validateParams.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr));
            }

            const validateBody = PatchLaporanReqSchema.safeParse(req.body);
            if (!validateBody.success) {
                const formattedErr = validateBody.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr));
            }

            const laporanId = validateParams.data.laporan_id;
            await this.adminService.patchLaporan(laporanId, validateBody.data);

            return res.status(200).json(sendSuccessfullResponse("Laporan berhasil diperbarui"));
        } catch (err: any) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message));
            }
            return res.status(500).json(sendErrorResponse("Gagal memperbarui laporan", err.message));
        }
    }

    async assignObToLocations(req: Request, res: Response) {
        try {
            const validateBody = AssignObToLocationsSchema.safeParse(req.body);
            if (!validateBody.success) {
                const formattedErr = validateBody.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr));
            }

            const { obId, lokasiIds, bulan, tahun } = validateBody.data;
            await this.adminService.assignObToLocations(obId, lokasiIds, bulan, tahun);

            return res.status(200).json(sendSuccessfullResponse("Berhasil memperbarui penugasan OB", null));
        } catch (err: any) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message));
            }
            return res.status(500).json(sendErrorResponse("Gagal memperbarui penugasan OB", err.message));
        }
    }

    async getPenugasanByPeriode(req: Request, res: Response) {
        try {
            const querySchema = z.object({
                bulan: z.coerce.number().int().min(1).max(12),
                tahun: z.coerce.number().int().min(2000).max(2100),
            });
            const validateQuery = querySchema.safeParse(req.query);
            if (!validateQuery.success) {
                const formattedErr = validateQuery.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr));
            }

            const { bulan, tahun } = validateQuery.data;
            const assignments = await this.adminService.getPenugasanByPeriode(bulan, tahun);

            return res.status(200).json(sendSuccessfullResponse("Berhasil mendapatkan penugasan OB", assignments));
        } catch (err: any) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message));
            }
            return res.status(500).json(sendErrorResponse("Gagal mendapatkan penugasan OB", err.message));
        }
    }
}
