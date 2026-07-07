import type { UserSearchQuery, UserStatsRes, RecentActivityPayload, ReportSummaryPayload, AdminReportDetailResponse } from "../dto/admin.js";
import type { PaginatedResponse } from "../dto/response.js";
import type { CreateUserReq, CreateUserRes, UpdateUserReq } from "../dto/users.js";
import type { DashboardMainResponse, GetDashboardQuery, RecentActivityResponse, StatDetail, BarChartResponse, PieChartResponse } from "../dto/admin.js";
import type { User } from "../generated/prisma/client.js";
import type { UserCreateInput, UserTokenCreateInput, UserUpdateInput } from "../generated/prisma/models.js";
import type { IAdminRepository } from "../repositories/admin_repository.interface.js";
import type { IObRepository } from "../repositories/ob_repository.interface.js";
import { AppError, handlePrismaError } from "../utils/error.js";
import  { calculateDateRanges } from "../utils/date.js"
import { LAPORAN_STATUS, type LaporanStatus } from "../utils/constants.js";
import { generateActivationToken } from "../utils/token.js";
import { buildActivationUrl, resolveFileUrl } from "../utils/url.js";
import type { IAdminService } from "./admin_service.interface.js";
import { StorageServiceFactory } from "./storage_service.factory.js";
import bcrypt from 'bcrypt';

export class AdminService implements IAdminService {
    private obRepo: IObRepository;
    private storageService = StorageServiceFactory.getProvider();
    private adminRepo: IAdminRepository;


    constructor(adminRepo: IAdminRepository, obRepo: IObRepository) {
        this.adminRepo = adminRepo;
        this.obRepo = obRepo;
    }

    async getAll(page: number, limit: number, query: UserSearchQuery): Promise<PaginatedResponse<User>> {
        try {
            const users = await this.adminRepo.getAll(page, limit, query);
            if (users && users.items) {
                users.items = users.items.map(user => {
                    if (user.profile_picture) {
                        user.profile_picture = resolveFileUrl(user.profile_picture);
                    }
                    return user;
                });
            }
            return users;
        } catch (err) {
            handlePrismaError(err)
        }
    }

    async getByID(userId: string): Promise<any | null> {
        try {
            const user = await this.adminRepo.getByID(userId);
            if (!user) return null;

            if (user.profile_picture) {
                user.profile_picture = resolveFileUrl(user.profile_picture);
            }

            let stats = null;
            if (user.role && user.role.nama_role.toLowerCase() === 'ob') {
                stats = await this.obRepo.getObPerformanceStats(userId);
            }

            return {
                ...user,
                stats
            };
        } catch (err) {
            handlePrismaError(err)
        }
    }

    async create(req: CreateUserReq): Promise<CreateUserRes> {
        try {
            const hashedPassword = await bcrypt.hash(req.password, 16);
            const activationToken = generateActivationToken(1);

            const userReq: UserCreateInput = {
                role: {
                    connect: { id: req.role_id }
                },
                username: req.username,
                email: req.email,
                password: hashedPassword,
                nama_lengkap: req.nama_lengkap,
            }

            const createdUser = await this.adminRepo.insert(userReq);

            const activationUserReq: UserTokenCreateInput = {
                user: {
                    connect: { id: createdUser.id }
                },
                token_hash: activationToken.tokenHash,
                type: "activation",
                expired_at: activationToken.expiredAt,
            }

            await this.adminRepo.insertActivationToken(activationUserReq);
            const activationUrl = buildActivationUrl(activationToken.token);

            const res: CreateUserRes = {
                activationUrl
            }

            return res;
        } catch (err) {
            handlePrismaError(err)
        }
    }

    async update(userId: string, req: UpdateUserReq, file?: Express.Multer.File): Promise<void> {
        try {
            const userReq: UserUpdateInput = {}

            if (file) {
                const oldUser = await this.adminRepo.getByID(userId);
                const oldPp = oldUser?.profile_picture || "";
                userReq.profile_picture = await this.storageService.updateFile(file, oldPp);
            }

            if (req.username !== undefined) userReq.username = req.username;
            if (req.nama_lengkap !== undefined) userReq.nama_lengkap = req.nama_lengkap;
            if (req.password !== undefined) userReq.password = await bcrypt.hash(req.password, 16);
            if (req.role_id !== undefined) {
                userReq.role = {
                    connect: { id: req.role_id }
                };
            }

            await this.adminRepo.update(userId, userReq as any);
        } catch (err) {
            handlePrismaError(err)
        }
    }

    async delete(userId: string): Promise<void> {
        try {
            await this.adminRepo.delete(userId);
        } catch (err) {
            handlePrismaError(err)
        }
    }

    async getUserStats(): Promise<UserStatsRes> {
        try {
            const data = await this.adminRepo.getUserStats();
            return data;
        } catch (err) {
            handlePrismaError(err)
        }
    }
    public async getDashboardData(query: GetDashboardQuery): Promise<DashboardMainResponse> {
        const { period } = query;
        
        const { current_start, current_end, previous_start, previous_end } = calculateDateRanges(period);

        const [rawActivities, currentReports, previousReports] = await Promise.all([
            this.adminRepo.getRecentActivities(5),
            this.adminRepo.getReportsByDateRange(current_start, current_end),
            this.adminRepo.getReportsByDateRange(previous_start, previous_end)
        ]);

        const kpi = this.calculateKpi(currentReports, previousReports);
        const pie_chart = this.calculatePieChart(currentReports);
        const bar_chart = this.calculateBarChart(currentReports, period);

        const recent_activities: RecentActivityResponse[] = rawActivities.map(
            (activity: RecentActivityPayload) => ({
                id: activity.id,
                title: activity.deskripsi_kendala,
                location: activity.lantai?.lokasi?.nama_lokasi 
                    ? `Lantai ${activity.lantai.nomor_lantai}, ${activity.lantai.lokasi.nama_lokasi}` 
                    : "Lokasi tidak diketahui",
                status: activity.status as LaporanStatus,
                assignee_name: activity.ob?.nama_lengkap || null,
                timestamp: activity.updated_at
            })
        );

        return { kpi, bar_chart, pie_chart, recent_activities };
    }

    private calculateKpi(current: ReportSummaryPayload[], previous: ReportSummaryPayload[]): DashboardMainResponse['kpi'] {
        const calculateTrend = (currCount: number, prevCount: number): StatDetail => {
            if (prevCount === 0) {
                return { count: currCount, trend_value: currCount > 0 ? 100 : 0, is_positive: currCount > 0 };
            }
            const diff = currCount - prevCount;
            const percentage = Math.round((diff / prevCount) * 100);
            return {
                count: currCount,
                trend_value: Math.abs(percentage),
                is_positive: percentage >= 0
            };
        };

        const currTotal = current.length;
        const prevTotal = previous.length;

        const currDone = current.filter(r => r.status === LAPORAN_STATUS.SELESAI).length;
        const prevDone = previous.filter(r => r.status === LAPORAN_STATUS.SELESAI).length;

        const currOngoing = current.filter(r => r.status === LAPORAN_STATUS.BELUM_DIKERJAKAN || r.status === LAPORAN_STATUS.PENDING).length;
        const prevOngoing = previous.filter(r => r.status === LAPORAN_STATUS.BELUM_DIKERJAKAN || r.status === LAPORAN_STATUS.PENDING).length;

        return {
            total_reports: calculateTrend(currTotal, prevTotal),
            completed_reports: calculateTrend(currDone, prevDone),
            ongoing_reports: calculateTrend(currOngoing, prevOngoing)
        };
    }

    private calculatePieChart(reports: ReportSummaryPayload[]): PieChartResponse[] {
        const total = reports.length;
        
        const counts: Record<LaporanStatus, number> = {
            [LAPORAN_STATUS.BELUM_DIKERJAKAN]: 0,
            [LAPORAN_STATUS.PENDING]: 0,
            [LAPORAN_STATUS.SELESAI]: 0,
            [LAPORAN_STATUS.DITOLAK]: 0,
        };

        reports.forEach(report => {
            const status = report.status as LaporanStatus;
            if (counts[status] !== undefined) {
                counts[status]++;
            }
        });

        return Object.keys(counts).map(key => {
            const status = key as LaporanStatus;
            return {
                status,
                count: counts[status],
                percentage: total > 0 ? Math.round((counts[status] / total) * 100) : 0
            };
        });
    }

    private calculateBarChart(reports: ReportSummaryPayload[], period: string): BarChartResponse[] {
        const groups: Record<string, number> = {};

        reports.forEach(report => {
            const date = new Date(report.created_at);
            let label = '';
            
            if (period === 'weekly') {
                label = date.toLocaleDateString('id-ID', { weekday: 'short' }); 
            } else if (period === 'monthly') {
                label = `Mgg ${Math.ceil(date.getDate() / 7)}`; 
            } else {
                label = date.toLocaleDateString('id-ID', { month: 'short' }); 
            }

            groups[label] = (groups[label] || 0) + 1;
        });

        return Object.keys(groups).map(label => ({
            label,
            count: groups[label] || 0
        }));
    }

    public async getReportDetail(id: string): Promise<AdminReportDetailResponse> {
    const laporan = await this.adminRepo.getReportDetailById(id);

    if (!laporan) {
        throw new AppError("Laporan tidak ditemukan", 404); 
    }

    const historiTerakhir = laporan.histori_pekerjaan?.[laporan.histori_pekerjaan.length - 1] ?? null;


    const jamUpload = historiTerakhir 
        ? historiTerakhir.created_at.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB"
        : null;

    return {
        id: laporan.id,
        status: laporan.status as LaporanStatus,
        nama_karyawan: laporan.pelapor?.nama_lengkap ?? "Anonim",
        lokasi: laporan.lantai?.lokasi
            ? `Lantai ${laporan.lantai.nomor_lantai} - ${laporan.lantai.lokasi.nama_lokasi}`
            : "Lokasi tidak diketahui",
        kategori: laporan.kategori.nama_kategori,
        ob_ditugaskan: laporan.ob?.nama_lengkap ?? "Belum Ditugaskan",
        waktu_laporan: laporan.created_at,
        waktu_selesai: historiTerakhir?.created_at ?? null,
        deskripsi_kendala: laporan.deskripsi_kendala,
        bukti_foto: {
            urls: laporan.status === "SELESAI" ? (historiTerakhir?.foto_selesai ?? []) : laporan.foto_masalah,
            diupload_oleh: laporan.ob?.nama_lengkap ?? null,
            jam_upload: jamUpload
        }
    };
}
}
