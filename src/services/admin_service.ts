import type { AdminLaporanQuery, PatchLaporanReq, AdminLaporanHistoryQuery, StatsTugasQuery, StatsLaporanQuery, ObPerformanceDashboardQuery } from "../dto/admin.js";
import type { AdminLaporanItemResponse, AdminLaporanPageResponse, UserStatsRes, RecentActivityPayload, ReportSummaryPayload, AdminReportDetailResponse, StatsTugasResponse, StatsLaporanResponse, AdminProfileData, ObRankingItem, ObPerformanceDashboardResponse, ObPerbandinganItem, TrenLaporanBulananItem } from "../types/admin.js";
import type { GetDashboardQuery } from "../dto/admin.js";
import type { DashboardMainResponse, RecentActivityResponse, StatDetail, BarChartResponse, PieChartResponse, DailyChecklistOBResponse } from "../types/admin.js";
import type { IAdminRepository, PenugasanObWithDetails, ObRankingRawData, TrenLaporanBulananRaw } from "../repositories/admin_repository.interface.js";
import type { AdminLaporanPayload } from "../repositories/laporan_repository.interface.js";
import type { ILaporanService } from "../services/laporan_service.interface.js";
import type { IUsersService } from "../services/users_service.interface.js";
import { AppError, handlePrismaError } from "../utils/error.js";
import { calculateDateRanges, calculatePeriodRange } from "../utils/date.js"
import { LAPORAN_STATUS, USER_ROLE, type LaporanPriority, type LaporanStatus } from "../utils/constants.js";
import { resolveFileUrl } from "../utils/url.js";
import { buildExportFilename, toLaporanCsv } from "../utils/csv.js";
import type { IAdminService } from "./admin_service.interface.js";
import type { Laporan_karyawan } from "../generated/prisma/client.js";
import type { DailyChecklistObReport } from "../repositories/admin_repository.interface.js";
import type { IRedisClient } from "../database/redis.interface.js";
import type { PaginatedResponse } from "../types/response.js";


export class AdminService implements IAdminService {
    private adminRepo: IAdminRepository;
    private laporanService: ILaporanService;
    private usersService: IUsersService;
    private redis: IRedisClient;

    constructor(adminRepo: IAdminRepository, laporanService: ILaporanService, usersService: IUsersService, redis: IRedisClient) {
        this.adminRepo = adminRepo;
        this.laporanService = laporanService;
        this.usersService = usersService;
        this.redis = redis
    }

    async getUserStats(): Promise<UserStatsRes> {
        try {
            const data = await this.adminRepo.getUserStats();
            return data;
        } catch (err) {
            handlePrismaError(err)
        }
    }

    async getAllLaporan(page: number, limit: number, query: AdminLaporanQuery): Promise<AdminLaporanPageResponse> {
        try {
            const [laporanData, informasiStatus, totalLaporanAktif] = await Promise.all([
                this.laporanService.getAllLaporan(page, limit, query),
                this.laporanService.getStatusInfo(query),
                this.laporanService.countLaporanAktif(query)
            ]);

            const laporanMapped: AdminLaporanItemResponse[] = laporanData.items.map((item: AdminLaporanPayload, index: number) => {
                const nomorLaporan = ((page - 1) * limit) + index + 1;

                const mapped = {
                    id: item.id,
                    id_laporan: `LPR - ${String(nomorLaporan).padStart(3, "0")}`,
                    nama_karyawan: item.pelapor?.nama_lengkap ?? "Anonim",
                    lokasi: item.lantai?.lokasi
                        ? `${item.lantai.lokasi.nama_lokasi} Lantai ${item.lantai.nomor_lantai}`
                        : "Lokasi tidak diketahui",
                    lokasi_id: item.lantai?.lokasi?.id ?? null,
                    lantai_id: item.lantai_id,
                    nomor_lantai: item.lantai?.nomor_lantai ?? 0,
                    kategori: item.kategori?.nama_kategori ?? "",
                    prioritas: item.prioritas as LaporanPriority,
                    status: item.status as LaporanStatus,
                    nama_ob: item.ob?.nama_lengkap ?? null,
                    created_at: item.created_at instanceof Date ? item.created_at.toISOString() : String(item.created_at),
                    updated_at: item.updated_at instanceof Date ? item.updated_at.toISOString() : String(item.updated_at),
                };
                return mapped;
            });

            const result: AdminLaporanPageResponse = {
                laporan: {
                    items: laporanMapped,
                    next_cursor: null,
                    meta: laporanData.meta ?? {
                        total_items: 0,
                        current_page: page,
                        limit,
                        total_pages: 0
                    }
                },
                informasi_status: informasiStatus,
                laporan_aktif: {
                    total_laporan: totalLaporanAktif
                }
            };

            return result;
        } catch (err) {
            handlePrismaError(err);
        }
    }

    async getLaporanExport(query: AdminLaporanQuery): Promise<{ filename: string; csv: string; total: number }> {
        const page = await this.getAllLaporan(1, 5000, query);
        const items = page.laporan.items;
        return {
            filename: buildExportFilename("laporan"),
            csv: toLaporanCsv(items),
            total: page.laporan.meta?.total_items ?? items.length,
        };
    }

    async getAllHistoryLaporan(page: number, limit: number, query: AdminLaporanHistoryQuery): Promise<PaginatedResponse<Laporan_karyawan>> {
        try {
            const laporan = await this.laporanService.getAllHistoryLaporan(page, limit, query)
            return laporan;
        } catch (err) {
            handlePrismaError(err)
        }
    }

    async getDashboardData(query: GetDashboardQuery, page_laporan: number, limit_laporan: number, page_tugas: number, limit_tugas: number): Promise<DashboardMainResponse> {
        const { period } = query;
        const cacheKey = `admin:dashboard:${period}:${page_laporan}:${limit_laporan}:${page_tugas}:${limit_tugas}`
        const cachedData = await this.redis.get(cacheKey)
        if (cachedData) {
            const parsedData = JSON.parse(cachedData)
            return parsedData
        }

        const { current_start, current_end, previous_start, previous_end } = calculateDateRanges(period);

        const [rawActivities, currentReports, previousReports, daily_checklist_ob, currTugasBelumDikerjakan, prevTugasBelumDikerjakan, currMenungguPersetujuan, prevMenungguPersetujuan, riwayatTugasRaw] = await Promise.all([
            this.laporanService.getRecentActivities(page_laporan, limit_laporan),
            this.laporanService.getReportsByDateRange(current_start, current_end),
            this.laporanService.getReportsByDateRange(previous_start, previous_end),
            this.adminRepo.getDailyChecklistOB(new Date()),
            this.adminRepo.countTugasBelumDikerjakan(current_start, current_end),
            this.adminRepo.countTugasBelumDikerjakan(previous_start, previous_end),
            this.adminRepo.countMenungguPersetujuan(current_start, current_end),
            this.adminRepo.countMenungguPersetujuan(previous_start, previous_end),
            this.adminRepo.getRiwayatTugasOB(page_tugas, limit_tugas)
        ]);

        const kpi = this.calculateKpi(currentReports, previousReports, currTugasBelumDikerjakan, prevTugasBelumDikerjakan, currMenungguPersetujuan, prevMenungguPersetujuan);
        const pie_chart = this.calculatePieChart(currentReports);
        const bar_chart = this.calculateBarChart(currentReports, period);

        const recent_activities: PaginatedResponse<RecentActivityResponse> = {
            items: rawActivities.items.map((activity: RecentActivityPayload) => ({
                id: activity.id,
                title: activity.deskripsi_kendala,
                location: activity.lantai?.lokasi?.nama_lokasi
                    ? `Lantai ${activity.lantai.nomor_lantai}, ${activity.lantai.lokasi.nama_lokasi}`
                    : "Lokasi tidak diketahui",
                status: activity.status as LaporanStatus,
                assignee_name: activity.ob?.nama_lengkap || null,
                timestamp: activity.updated_at
            })),
            next_cursor: rawActivities.next_cursor,
            meta: rawActivities.meta ?? {
                total_items: 0,
                current_page: 1,
                limit: limit_laporan,
                total_pages: 0
            }
        };

        const daily_checklist_ob_mapped: DailyChecklistOBResponse[] = daily_checklist_ob.map((item: DailyChecklistObReport) => ({
            nama_ob: item.nama_ob,
            total_tugas: item.total,
            tugas_selesai: item.selesai,
            persentase: item.persentase
        }));

        const dashboard: DashboardMainResponse = { 
            kpi, 
            bar_chart, 
            pie_chart, 
            recent_activities, 
            daily_checklist_ob: daily_checklist_ob_mapped,
            riwayat_tugas_ob: riwayatTugasRaw,
        };
        await this.redis.setEx(cacheKey, 300, JSON.stringify(dashboard))
        return dashboard;
    }

    async getReportDetail(id: string): Promise<AdminReportDetailResponse> {
        const laporan = await this.laporanService.getReportDetailWithRelations(id);

        if (!laporan) {
            throw new AppError("Laporan tidak ditemukan", 404);
        }

        const historiTerakhir = laporan.histori_pekerjaan?.[laporan.histori_pekerjaan.length - 1] ?? null;

        const jamUpload = historiTerakhir
            ? historiTerakhir.created_at.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB"
            : null;

        let total_durasi: number | null = null;
        if (laporan.dikerjakan_at && laporan.selesai_at) {
            total_durasi = Math.floor((laporan.selesai_at.getTime() - laporan.dikerjakan_at.getTime()) / 1000);
        }

        const detail: AdminReportDetailResponse = {
            id: laporan.id,
            status: laporan.status as LaporanStatus,
            prioritas: laporan.prioritas as LaporanPriority,
            nama_karyawan: laporan.pelapor?.nama_lengkap ?? "Anonim",
            lokasi: laporan.lantai?.lokasi
                ? `Lantai ${laporan.lantai.nomor_lantai} - ${laporan.lantai.lokasi.nama_lokasi}`
                : "Lokasi tidak diketahui",
            kategori: laporan.kategori.nama_kategori,
            ob_ditugaskan: laporan.ob?.nama_lengkap ?? "Belum Ditugaskan",
            waktu_laporan: laporan.created_at,
            waktu_selesai: historiTerakhir?.created_at ?? null,
            dikerjakan_at: laporan.dikerjakan_at,
            selesai_at: laporan.selesai_at,
            dibatalkan_at: laporan.dibatalkan_at,
            admin_catatan: laporan.admin_catatan,
            catatan_ob: historiTerakhir?.catatan ?? null,
            total_durasi,
            deskripsi_kendala: laporan.deskripsi_kendala,
            bukti_foto: {
                urls: laporan.status === "SELESAI"
                    ? (historiTerakhir?.foto_selesai ?? []).map(resolveFileUrl).filter((url): url is string => !!url)
                    : laporan.foto_masalah.map(resolveFileUrl).filter((url): url is string => !!url),
                diupload_oleh: laporan.ob?.nama_lengkap ?? null,
                jam_upload: jamUpload
            }
        };

        return detail;
    }
    
    async assignObToLocations(obId: string, lokasiIds: string[], bulan: number, tahun: number): Promise<void> {
        try {
            const obUser = await this.usersService.getByID(obId);
            if (!obUser) {
                throw new AppError("OB user tidak ditemukan", 404);
            }
            if (obUser.role?.nama_role?.toLowerCase() !== USER_ROLE.OB) {
                throw new AppError("User bukan merupakan OB", 400);
            }

            await this.adminRepo.assignObToLocations(obId, lokasiIds, bulan, tahun);
        } catch (err) {
            throw handlePrismaError(err);
        }
    }

    async getPenugasanByPeriode(bulan: number, tahun: number): Promise<PenugasanObWithDetails[]> {
        try {
            const penugasan = await this.adminRepo.getPenugasanByPeriode(bulan, tahun);
            return penugasan;
        } catch (err) {
            throw handlePrismaError(err);
        }
    }

    async patchLaporan(laporanId: string, dto: PatchLaporanReq): Promise<void> {
        try {
            const laporan = await this.laporanService.getReportDetailWithRelations(laporanId);
            if (!laporan) throw new AppError("Laporan tidak ditemukan", 404);

            if (dto.ob_id) {
                const obUser = await this.usersService.getByID(dto.ob_id);
                if (!obUser || obUser.role?.nama_role !== USER_ROLE.OB) {
                    throw new AppError("OB tidak ditemukan", 404);
                }
            }

            if (dto.status === LAPORAN_STATUS.PENDING) {
                const targetObId = dto.ob_id ?? laporan.ob_id;
                if (!targetObId) {
                    throw new AppError("Status PENDING memerlukan OB yang ditugaskan", 400);
                }
            }

            await this.laporanService.patchLaporan(laporanId, dto);
        } catch (err: unknown) {
            throw handlePrismaError(err);
        }
    }

    async approveLaporan(laporanId: string, catatan?: string): Promise<Laporan_karyawan> {
        try {
            const laporan = await this.laporanService.getReportDetail(laporanId);
            if (!laporan) throw new AppError("Laporan tidak ditemukan", 404);

            const result = await this.laporanService.approveLaporan(laporanId, catatan);
            return result;
        } catch (err) {
            throw handlePrismaError(err);
        }
    }

    async rejectLaporan(laporanId: string, catatan: string): Promise<Laporan_karyawan> {
        try {
            const laporan = await this.laporanService.getReportDetail(laporanId);
            if (!laporan) throw new AppError("Laporan tidak ditemukan", 404);

            const result = await this.laporanService.rejectLaporan(laporanId, catatan);
            return result;
        } catch (err) {
            throw handlePrismaError(err);
        }
    }

    async deleteLaporan(laporanId: string): Promise<void> {
        try {
            const laporan = await this.laporanService.getReportDetail(laporanId);
            if (!laporan) throw new AppError("Laporan tidak ditemukan", 404);

            await this.laporanService.deleteLaporan(laporanId);
        } catch (err) {
            throw handlePrismaError(err);
        }
    }

    async getAdminStats(userId: string): Promise<AdminProfileData> {
        try {
            const [total_tugas_approved, laporan_direview, hari_aktif] = await Promise.all([
                this.adminRepo.getTotalApprovedTugas(),
                this.adminRepo.getTotalReviewedLaporan(),
                this.adminRepo.countActiveDays(userId),
            ]);
            return { total_tugas_approved, laporan_direview, hari_aktif };
        } catch (err) {
            throw handlePrismaError(err);
        }
    }

    async getStatsLaporan(query: StatsLaporanQuery): Promise<StatsLaporanResponse> {
        try {
            const raw = await this.adminRepo.getStatsLaporan(query);
            return raw;
        } catch (err) {
            throw handlePrismaError(err);
        }
    }

    async getStatsTugas(query: StatsTugasQuery): Promise<StatsTugasResponse> {
        try {
            const raw = await this.adminRepo.getStatsTugas(query);
            const result: StatsTugasResponse = {
                total: raw.checklist.total + raw.tugas.total,
                diproses_ob: raw.checklist.diproses + raw.tugas.diproses,
                menunggu_persetujuan: raw.checklist.menunggu + raw.tugas.menunggu,
            };
            return result;
        } catch (err) {
            throw handlePrismaError(err);
        }
    }

    private calculateBarChart(reports: ReportSummaryPayload[], period: string): BarChartResponse[] {
        const groups: Record<string, number> = {};

        const DAY_LABELS: Record<number, string> = {
            0: "Min", 1: "Sen", 2: "Sel", 3: "Rab",
            4: "Kam", 5: "Jum", 6: "Sab"
        };

        reports.forEach(report => {
            const date = new Date(report.created_at);
            let label = '';

            if (period === 'harian') {
                label = `${String(date.getHours()).padStart(2, '0')}:00`;
            } else if (period === 'mingguan') {
                label = date.toLocaleDateString('id-ID', { weekday: 'short' });
            } else if (period === 'bulanan') {
                label = `Mgg ${Math.ceil(date.getDate() / 7)}`;
            } else {
                label = date.toLocaleDateString('id-ID', { month: 'short' });
            }

            groups[label] = (groups[label] || 0) + 1;
        });

        if (period === 'mingguan') {
            const orderedLabels = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
            const result = orderedLabels
                .filter(label => label in groups || true)
                .map(label => ({ label, count: groups[label] || 0 }));
            return result;
        }

        const result = Object.keys(groups).map(label => ({
            label,
            count: groups[label] || 0
        }));
        return result;
    }


    private calculateKpi(current: ReportSummaryPayload[], previous: ReportSummaryPayload[], currTugasBelumDikerjakan: number, prevTugasBelumDikerjakan: number, currMenungguPersetujuan: number, prevMenungguPersetujuan: number): DashboardMainResponse['kpi'] {
        const calculateTrend = (currCount: number, prevCount: number): StatDetail => {
            if (prevCount === 0) {
                const trendDetail = { count: currCount, trend_value: currCount > 0 ? 100 : 0, is_positive: currCount > 0 };
                return trendDetail;
            }
            const diff = currCount - prevCount;
            const percentage = Math.round((diff / prevCount) * 100);
            const trendDetail = {
                count: currCount,
                trend_value: Math.abs(percentage),
                is_positive: percentage >= 0
            };
            return trendDetail;
        };

        const currTotal = current.length;
        const prevTotal = previous.length;

        const currDone = current.filter(r => r.status === LAPORAN_STATUS.SELESAI).length;
        const prevDone = previous.filter(r => r.status === LAPORAN_STATUS.SELESAI).length;

        const currOngoing = current.filter(r => r.status === LAPORAN_STATUS.BELUM_DIKERJAKAN || r.status === LAPORAN_STATUS.SEDANG_DIKERJAKAN || r.status === LAPORAN_STATUS.PENDING).length;
        const prevOngoing = previous.filter(r => r.status === LAPORAN_STATUS.BELUM_DIKERJAKAN || r.status === LAPORAN_STATUS.SEDANG_DIKERJAKAN || r.status === LAPORAN_STATUS.PENDING).length;

        const currDibatalkan = current.filter(r => r.status === LAPORAN_STATUS.DIBATALKAN).length;
        const prevDibatalkan = previous.filter(r => r.status === LAPORAN_STATUS.DIBATALKAN).length;

        const kpi: DashboardMainResponse['kpi'] = {
            total_laporan: calculateTrend(currTotal, prevTotal),
            laporan_selesai: calculateTrend(currDone, prevDone),
            laporan_berjalan: calculateTrend(currOngoing, prevOngoing),
            laporan_dibatalkan: calculateTrend(currDibatalkan, prevDibatalkan),
            tugas_belum_dikerjakan: calculateTrend(currTugasBelumDikerjakan, prevTugasBelumDikerjakan),
            menunggu_persetujuan: calculateTrend(currMenungguPersetujuan, prevMenungguPersetujuan)
        };

        return kpi;
    }

    private calculatePieChart(reports: ReportSummaryPayload[]): PieChartResponse[] {
        const total = reports.length;

        const STATUS_LABEL_MAP: Record<LaporanStatus, string> = {
            [LAPORAN_STATUS.BELUM_DIKERJAKAN]: "Masuk",
            [LAPORAN_STATUS.SEDANG_DIKERJAKAN]: "Dikerjakan",
            [LAPORAN_STATUS.PENDING]: "Menunggu",
            [LAPORAN_STATUS.SELESAI]: "Selesai",
            [LAPORAN_STATUS.DIBATALKAN]: "Dibatalkan",
        };

        const counts: Record<LaporanStatus, number> = {
            [LAPORAN_STATUS.BELUM_DIKERJAKAN]: 0,
            [LAPORAN_STATUS.SEDANG_DIKERJAKAN]: 0,
            [LAPORAN_STATUS.PENDING]: 0,
            [LAPORAN_STATUS.SELESAI]: 0,
            [LAPORAN_STATUS.DIBATALKAN]: 0,
        };

        reports.forEach(report => {
            const status = report.status as LaporanStatus;
            if (counts[status] !== undefined) {
                counts[status]++;
            }
        });

        const result = Object.keys(counts).map(key => {
            const status = key as LaporanStatus;
            const mapped = {
                status,
                label: STATUS_LABEL_MAP[status],
                count: counts[status],
                percentage: total > 0 ? Math.round((counts[status] / total) * 100) : 0
            };
            return mapped;
        });
        return result;
    }

    async getObPerformanceDashboard(query: ObPerformanceDashboardQuery): Promise<ObPerformanceDashboardResponse> {
        try {
            const dateRange = calculatePeriodRange(query.period);
            const bulanAwal = new Date();
            bulanAwal.setFullYear(bulanAwal.getFullYear() - 1);
            bulanAwal.setDate(1);
            bulanAwal.setHours(0, 0, 0, 0);

            const [obStats, laporanMenunggu, trenBulanan] = await Promise.all([
                this.adminRepo.getObStatsByPeriod(dateRange.start, dateRange.end),
                this.adminRepo.getLaporanMenungguInRange(dateRange.start, dateRange.end),
                this.adminRepo.getTrenLaporanBulanan(bulanAwal),
            ]);

            const totalClaimed = obStats.reduce((sum, o) => sum + o.total_tugas_claimed, 0);
            const totalSelesai = obStats.reduce((sum, o) => sum + o.total_tugas_selesai, 0);
            const produktivitas = totalClaimed > 0 ? Math.round((totalSelesai / totalClaimed) * 100 * 10) / 10 : 0;

            const bulanNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

            const response: ObPerformanceDashboardResponse = {
                produktivitas,
                tugas_diselesaikan: { selesai: totalSelesai, total: totalClaimed },
                laporan_menunggu: laporanMenunggu,
                perbandingan_ob: obStats.map((o: ObRankingRawData) => ({
                    ob_id: o.ob_id,
                    nama_ob: o.nama_lengkap,
                    total_tugas: o.total_tugas_claimed,
                    tugas_selesai: o.total_tugas_selesai,
                    persentase: o.total_tugas_claimed > 0
                        ? Math.round((o.total_tugas_selesai / o.total_tugas_claimed) * 100 * 10) / 10
                        : 0,
                })),
                tren_laporan_bulanan: trenBulanan.map((t: TrenLaporanBulananRaw) => {
                    const parts = (t.bulan ?? '').split('-');
                    const tahun = parts[0] ?? '';
                    const bulan = parts[1] ?? '';
                    const bulanIdx = parseInt(bulan, 10) - 1;
                    return {
                        bulan: t.bulan,
                        label: `${bulanNames[bulanIdx] ?? ''} ${tahun}`,
                        total: t.total,
                        baru: t.baru,
                        sedang_dikerjakan: t.sedang_dikerjakan,
                        pending: t.pending,
                        selesai: t.selesai,
                        dibatalkan: t.dibatalkan,
                    };
                }),
            };

            return response;
        } catch (err) {
            throw handlePrismaError(err);
        }
    }

    async getObRanking(): Promise<ObRankingItem[]> {
        try {
            const data = await this.adminRepo.getObRanking();
            return data.map((item: ObRankingRawData) => ({
                ob: {
                    id: item.ob_id,
                    nama_lengkap: item.nama_lengkap,
                    profile_picture: item.profile_picture,
                    skills: item.skills.map(sk => ({
                        id: sk.skill_id,
                        nama_skill: sk.nama_skill,
                        diperoleh_at: sk.diperoleh_at,
                    })),
                },
                total_tugas_claimed: item.total_tugas_claimed,
                total_tugas_selesai: item.total_tugas_selesai,
                rata_rata_kecepatan: item.rata_rata_kecepatan,
            }));
        } catch (err) {
            throw handlePrismaError(err);
        }
    }
}
