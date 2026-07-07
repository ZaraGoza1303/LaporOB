import type { PaginatedResponse } from "../dto/response.js";
import type { CreateUserReq, CreateUserRes, UpdateUserReq } from "../dto/users.js";
import type { DashboardMainResponse, GetDashboardQuery, RecentActivityResponse, StatDetail, BarChartResponse, PieChartResponse } from "../dto/admin.js";
import type { User } from "../generated/prisma/client.js";
import type { UserCreateInput, UserTokenCreateInput, UserUpdateInput } from "../generated/prisma/models.js";
import type { IUsersRepository } from "../repositories/users_repository.interface.js";
import type { IAdminRepository, RecentActivityPayload, ReportSummaryPayload } from "../repositories/admin_repository.interface.js";
import { handlePrismaError } from "../utils/error.js";
import  { calculateDateRanges } from "../utils/date.js"
import { LAPORAN_STATUS, type LaporanStatus } from "../utils/constants.js";
import { generateActivationToken } from "../utils/token.js";
import { buildActivationUrl, resolveFileUrl } from "../utils/url.js";
import type { IAdminService } from "./admin_service.interface.js";
import { StorageServiceFactory } from "./storage_service.factory.js";
import bcrypt from 'bcrypt';

export class AdminService implements IAdminService {
    private usersRepo: IUsersRepository;
    private storageService = StorageServiceFactory.getProvider();
    private adminRepo: IAdminRepository;

    constructor(usersRepo: IUsersRepository, adminRepo: IAdminRepository) {
        this.usersRepo = usersRepo;
        this.adminRepo = adminRepo;
    }

    async getAll(page: number, limit: number, search?: string | null): Promise<PaginatedResponse<User>> {
        try {
            const users = await this.usersRepo.getAll(page, limit, search);
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

    async getByID(userId: string): Promise<User | null> {
        try {
            const user = await this.usersRepo.getByID(userId);
            if (user && user.profile_picture) {
                user.profile_picture = resolveFileUrl(user.profile_picture);
            }
            return user;
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

            const createdUser = await this.usersRepo.insert(userReq);

            const activationUserReq: UserTokenCreateInput = {
                user: {
                    connect: { id: createdUser.id }
                },
                token_hash: activationToken.tokenHash,
                type: "activation",
                expired_at: activationToken.expiredAt,
            }

            await this.usersRepo.insertActivationToken(activationUserReq);
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
                const oldUser = await this.usersRepo.getByID(userId);
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

            await this.usersRepo.update(userId, userReq as any);
        } catch (err) {
            handlePrismaError(err)
        }
    }

    async delete(userId: string): Promise<void> {
        try {
            await this.usersRepo.delete(userId);
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
}
