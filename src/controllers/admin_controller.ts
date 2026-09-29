
import { AdminLaporanHistoryQuerySchema, AdminLaporanQuerySchema, AssignObToLocationsSchema, GetDashboardQuerySchema, PatchLaporanReqSchema, StatsTugasQuerySchema, StatsLaporanQuerySchema, PekerjaanListQuerySchema, ObPerformanceDashboardQuerySchema } from '../dto/admin.js';
import { LaporanIdParamSchema } from '../dto/users.js';
import { ChecklistHarianIdParamSchema } from '../dto/checklist_harian.js';
import { ObTugasIdParamSchema } from '../dto/ob.js';
import type { IAdminService } from "../services/admin_service.interface.js";
import type { IChecklistHarianService } from "../services/checklistHarian_service.interface.js";
import type { ITugasService } from "../services/tugas_service.interface.js";
import type { ISkillService } from "../services/skill_service.interface.js";
import { sendErrorResponse, sendSuccessfullResponse } from "../utils/response.js";
import type { Request, Response } from "express";
import { AppError } from "../utils/error.js";
import { z } from "zod";
import { calculatePeriodRange } from "../utils/date.js";

export class AdminController {
    private adminService: IAdminService;
    private checklistHarianService: IChecklistHarianService;
    private tugasService: ITugasService;
    private skillService: ISkillService;

    constructor(adminService: IAdminService, checklistHarianService: IChecklistHarianService, tugasService: ITugasService, skillService: ISkillService) {
        this.adminService = adminService;
        this.checklistHarianService = checklistHarianService;
        this.tugasService = tugasService;
        this.skillService = skillService;
    }

    async getDashboardData(req: Request, res: Response) {
        try {
            const parsedQuery = GetDashboardQuerySchema.safeParse(req.query);
            if (!parsedQuery.success) {
                const formattedErr = parsedQuery.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr));
            }

            const page_laporan = parseInt(String(req.query.page_laporan), 10) || 1;
            const limit_laporan = parseInt(String(req.query.limit_laporan), 10) || 4;
            const page_tugas = parseInt(String(req.query.page_tugas), 10) || 1;
            const limit_tugas = parseInt(String(req.query.limit_tugas), 10) || 4;

            const dashboardData = await this.adminService.getDashboardData(parsedQuery.data, page_laporan, limit_laporan, page_tugas, limit_tugas);

            return res.status(200).json(
                sendSuccessfullResponse("Berhasil mengambil data dashboard admin", dashboardData)
            );
        } catch (err: unknown) {
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
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message));
            }
            return res.status(500).json(sendErrorResponse("Gagal mendapatkan data laporan pengguna"));
        }
    }

    async getAllHistoryLaporan(req: Request, res: Response) {
        try {
            const page = parseInt(String(req.query.page), 10) || 1;
            const limit = parseInt(String(req.query.limit), 10) || 10;

            const validate = AdminLaporanHistoryQuerySchema.safeParse(req.query);
            if (!validate.success) {
                const formatedErr = validate.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formatedErr));
            }

            const response = await this.adminService.getAllHistoryLaporan(page, limit, validate.data);
            return res.status(200).json(sendSuccessfullResponse("Berhasil mendapatkan data laporan pengguna", response));

        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message));
            }
            return res.status(500).json(sendErrorResponse("Gagal mendapatkan data laporan pengguna"));
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
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message));
            }
            return res.status(500).json(sendErrorResponse("Gagal mendapatkan detail laporan"));
        }
    }

    async getUserStats(req: Request, res: Response) {
        try {
            const response = await this.adminService.getUserStats()
            return res.status(200).json(sendSuccessfullResponse("Berhasil mendapatkan data", response));
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Gagal mendapatkan data"))
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
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message));
            }
            return res.status(500).json(sendErrorResponse("Gagal memperbarui laporan"));
        }
    }

    async assignObToLocations(req: Request, res: Response) {
        try {
            const validateBody = AssignObToLocationsSchema.safeParse(req.body);
            if (!validateBody.success) {
                const formattedErr = validateBody.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr));
            }

            const { ob_id: obId, lokasi_ids: lokasiIds, bulan, tahun } = validateBody.data;
            await this.adminService.assignObToLocations(obId, lokasiIds, bulan, tahun);

            const assignments = await this.adminService.getPenugasanByPeriode(bulan, tahun);

            return res.status(200).json(sendSuccessfullResponse("Berhasil memperbarui penugasan OB", assignments));
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message));
            }
            return res.status(500).json(sendErrorResponse("Gagal memperbarui penugasan OB"));
        }
    }

    async getPenugasanByPeriode(req: Request, res: Response) {
        try {
        const querySchema = z.object({
            bulan: z.coerce.number().int().min(1).max(12).default(() => new Date().getMonth() + 1),
            tahun: z.coerce.number().int().min(2000).max(2100).default(() => new Date().getFullYear()),
        });
            const validateQuery = querySchema.safeParse(req.query);
            if (!validateQuery.success) {
                const formattedErr = validateQuery.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr));
            }

            const { bulan, tahun } = validateQuery.data;
            const assignments = await this.adminService.getPenugasanByPeriode(bulan, tahun);

            return res.status(200).json(sendSuccessfullResponse("Berhasil mendapatkan penugasan OB", assignments));
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message));
            }
            return res.status(500).json(sendErrorResponse("Gagal mendapatkan penugasan OB"));
        }
    }

    async approveLaporan(req: Request, res: Response) {
        try {
            const validateParams = LaporanIdParamSchema.safeParse(req.params);
            if (!validateParams.success) {
                const formattedErr = validateParams.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr));
            }

            const schemaBody = z.object({
                catatan: z.string().optional(),
            });
            const validateBody = schemaBody.safeParse(req.body);
            if (!validateBody.success) {
                const formattedErr = validateBody.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr));
            }

            const laporanId = validateParams.data.laporan_id;
            const response = await this.adminService.approveLaporan(laporanId, validateBody.data.catatan);

            return res.status(200).json(sendSuccessfullResponse("Pekerjaan berhasil disetujui", response));
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message));
            }
            return res.status(500).json(sendErrorResponse("Gagal menyetujui pekerjaan"));
        }
    }

    async rejectLaporan(req: Request, res: Response) {
        try {
            const validateParams = LaporanIdParamSchema.safeParse(req.params);
            if (!validateParams.success) {
                const formattedErr = validateParams.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr));
            }

            const schemaBody = z.object({
                alasan: z.string().min(1, "Catatan alasan pembatalan wajib diisi"),
            });
            const validateBody = schemaBody.safeParse(req.body);
            if (!validateBody.success) {
                const formattedErr = validateBody.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr));
            }

            const laporanId = validateParams.data.laporan_id;
            const response = await this.adminService.rejectLaporan(laporanId, validateBody.data.alasan);

            return res.status(200).json(sendSuccessfullResponse("Pekerjaan berhasil dibatalkan dan dikembalikan ke antrean", response));
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message));
            }
            return res.status(500).json(sendErrorResponse("Gagal membatalkan pekerjaan"));
        }
    }

    async deleteLaporan(req: Request, res: Response) {
        try {
            const validateParams = LaporanIdParamSchema.safeParse(req.params);
            if (!validateParams.success) {
                const formattedErr = validateParams.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr));
            }

            const laporanId = validateParams.data.laporan_id;
            await this.adminService.deleteLaporan(laporanId);

            return res.status(200).json(sendSuccessfullResponse("Laporan berhasil dihapus"));
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message));
            }
            return res.status(500).json(sendErrorResponse("Gagal menghapus laporan"));
        }
    }

    async getStatsLaporan(req: Request, res: Response) {
        try {
            const validate = StatsLaporanQuerySchema.safeParse(req.query);
            if (!validate.success) {
                const formattedErr = validate.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr));
            }

            const response = await this.adminService.getStatsLaporan(validate.data);
            return res.status(200).json(sendSuccessfullResponse("Berhasil mengambil data statistik laporan", response));
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message));
            }
            return res.status(500).json(sendErrorResponse("Gagal mengambil data statistik laporan"));
        }
    }

    async getStatsTugas(req: Request, res: Response) {
        try {
            const validate = StatsTugasQuerySchema.safeParse(req.query);
            if (!validate.success) {
                const formattedErr = validate.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr));
            }

            const response = await this.adminService.getStatsTugas(validate.data);
            return res.status(200).json(sendSuccessfullResponse("Berhasil mengambil data statistik tugas", response));
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message));
            }
            return res.status(500).json(sendErrorResponse("Gagal mengambil data statistik tugas"));
        }
    }

    async getApprovalListTugas(req: Request, res: Response) {
        try {
            const validate = StatsTugasQuerySchema.safeParse(req.query);
            if (!validate.success) {
                const formattedErr = validate.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr));
            }

            const dateRange = calculatePeriodRange(validate.data.period);
            const response = await this.tugasService.getPendingApprovalTugas(dateRange, validate.data.lokasi_id);
            return res.status(200).json(sendSuccessfullResponse("Berhasil mengambil data approval tugas", response));
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message));
            }
            return res.status(500).json(sendErrorResponse("Gagal mengambil data approval tugas"));
        }
    }

    async approveTugas(req: Request, res: Response) {
        try {
            const validateParams = ObTugasIdParamSchema.safeParse(req.params);
            if (!validateParams.success) {
                const formattedErr = validateParams.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr));
            }

            const adminId = req.user?.id ?? '';
            await this.tugasService.approveTugas(validateParams.data.tugas_id, adminId);
            return res.status(200).json(sendSuccessfullResponse("Tugas berhasil disetujui"));
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message));
            }
            return res.status(500).json(sendErrorResponse("Gagal menyetujui tugas"));
        }
    }

    async getApprovalListChecklist(req: Request, res: Response) {
        try {
            const validate = StatsTugasQuerySchema.safeParse(req.query);
            if (!validate.success) {
                const formattedErr = validate.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr));
            }

            const dateRange = calculatePeriodRange(validate.data.period);
            const response = await this.checklistHarianService.getPendingApprovalChecklist(dateRange, validate.data.lokasi_id);
            return res.status(200).json(sendSuccessfullResponse("Berhasil mengambil data approval checklist", response));
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message));
            }
            return res.status(500).json(sendErrorResponse("Gagal mengambil data approval checklist"));
        }
    }

    async getObAcquiredSkills(req: Request, res: Response) {
        try {
            const paramsSchema = z.object({ ob_id: z.string().uuid() });
            const validateParams = paramsSchema.safeParse(req.params);
            if (!validateParams.success) {
                return res.status(400).json(sendErrorResponse("Validation Failed", validateParams.error.flatten().fieldErrors));
            }

            const result = await this.skillService.getAcquiredObSkills(validateParams.data.ob_id);
            return res.status(200).json(sendSuccessfullResponse("Berhasil mengambil skill OB", result));
        } catch (err: unknown) {
            if (err instanceof AppError) return res.status(err.statusCode).json(sendErrorResponse(err.message));
            return res.status(500).json(sendErrorResponse("Gagal mengambil skill OB"));
        }
    }

    async getObPerformanceDashboard(req: Request, res: Response) {
        try {
            const validate = ObPerformanceDashboardQuerySchema.safeParse(req.query);
            if (!validate.success) {
                const formattedErr = validate.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr));
            }

            const response = await this.adminService.getObPerformanceDashboard(validate.data);
            return res.status(200).json(sendSuccessfullResponse("Berhasil mengambil data performa OB", response));
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message));
            }
            return res.status(500).json(sendErrorResponse("Gagal mengambil data performa OB"));
        }
    }

    async getObRanking(req: Request, res: Response) {
        try {
            const response = await this.adminService.getObRanking();
            return res.status(200).json(sendSuccessfullResponse("Berhasil mengambil data ranking OB", response));
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message));
            }
            return res.status(500).json(sendErrorResponse("Gagal mengambil data ranking OB"));
        }
    }

    async getListPekerjaan(req: Request, res: Response) {
        try {
            const validate = PekerjaanListQuerySchema.safeParse(req.query);
            if (!validate.success) {
                const formattedErr = validate.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr));
            }

            const { page, limit, search } = validate.data;
            const [checklist, tugas] = await Promise.all([
                this.checklistHarianService.getAllPaginated(page, limit, search),
                this.tugasService.getAllPaginated(page, limit, search),
            ]);

            return res.status(200).json(sendSuccessfullResponse("Berhasil mengambil data pekerjaan", { checklist, tugas }));
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message));
            }
            return res.status(500).json(sendErrorResponse("Gagal mengambil data pekerjaan"));
        }
    }

    async approveChecklist(req: Request, res: Response) {
        try {
            const validateParams = ChecklistHarianIdParamSchema.safeParse(req.params);
            if (!validateParams.success) {
                const formattedErr = validateParams.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr));
            }

            const adminId = req.user?.id ?? '';
            await this.checklistHarianService.approveChecklist(validateParams.data.checklist_harian_id, adminId);
            return res.status(200).json(sendSuccessfullResponse("Checklist berhasil disetujui"));
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message));
            }
            return res.status(500).json(sendErrorResponse("Gagal menyetujui checklist"));
        }
    }

    async exportObPerformanceExcel(req: Request, res: Response) {
        try {
            const validate = ObPerformanceDashboardQuerySchema.safeParse(req.query);
            if (!validate.success) {
                const formattedErr = validate.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr));
            }

            const result = await this.adminService.getObPerformanceExport(validate.data);
            res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            res.setHeader("Content-Disposition", `attachment; filename="${result.filename}"`);
            
            return res.status(200).send(result.buffer);
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message));
            }
            return res.status(500).json(sendErrorResponse("Gagal mengekspor performa OB"));
        }
    }
}
