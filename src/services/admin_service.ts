import type { AdminLaporanItemResponse, AdminLaporanPageResponse, AdminLaporanQuery, PatchLaporanReq, UserStatsRes, RecentActivityPayload, ReportSummaryPayload, AdminReportDetailResponse } from "../dto/admin.js";
import type { DashboardMainResponse, GetDashboardQuery, RecentActivityResponse, StatDetail, BarChartResponse, PieChartResponse, DailyChecklistOBResponse } from "../dto/admin.js";
import type { IAdminRepository, PenugasanObWithDetails } from "../repositories/admin_repository.interface.js";
import type { AdminLaporanPayload } from "../repositories/laporan_repository.interface.js";
import type { ILaporanService } from "../services/laporan_service.interface.js";
import type { IUsersService } from "../services/users_service.interface.js";
import { AppError, handlePrismaError } from "../utils/error.js";
import { calculateDateRanges } from "../utils/date.js"
import { LAPORAN_STATUS, type LaporanPriority, type LaporanStatus } from "../utils/constants.js";
import { resolveFileUrl } from "../utils/url.js";
import type { IAdminService } from "./admin_service.interface.js";
import type { Laporan_karyawan } from "../generated/prisma/client.js";
import type { DailyChecklistObReport } from "../repositories/admin_repository.interface.js";

export class AdminService implements IAdminService {
    private adminRepo: IAdminRepository;
    private laporanService: ILaporanService;
    private usersService: IUsersService;

    constructor(adminRepo: IAdminRepository, laporanService: ILaporanService, usersService: IUsersService) {
        this.adminRepo = adminRepo;
        this.laporanService = laporanService;
        this.usersService = usersService;
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
            const [laporanData, ruanganTerpopuler, totalLaporanAktif] = await Promise.all([
                this.laporanService.getAllLaporan(page, limit, query),
                this.laporanService.getRuanganTerpopuler(6, query),
                this.laporanService.countLaporanAktif(query)
            ]);

            const laporanMapped: AdminLaporanItemResponse[] = laporanData.items.map((item: AdminLaporanPayload, index: number) => {
                const nomorLaporan = ((page - 1) * limit) + index + 1;

                return {
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
            });

            return {
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
                ruangan_terpopuler: ruanganTerpopuler,
                laporan_aktif: {
                    total_laporan: totalLaporanAktif
                }
            };
        } catch (err) {
            handlePrismaError(err);
        }
    }

    public async getDashboardData(query: GetDashboardQuery): Promise<DashboardMainResponse> {
        const { period } = query;

        const { current_start, current_end, previous_start, previous_end } = calculateDateRanges(period);

        const [rawActivities, currentReports, previousReports, daily_checklist_ob] = await Promise.all([
            this.laporanService.getRecentActivities(5),
            this.laporanService.getReportsByDateRange(current_start, current_end),
            this.laporanService.getReportsByDateRange(previous_start, previous_end),
            this.adminRepo.getDailyChecklistOB(new Date())
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

        const daily_checklist_ob_mapped: DailyChecklistOBResponse[] = daily_checklist_ob.map((item: DailyChecklistObReport) => ({
            nama_ob: item.nama_ob,
            total_tugas: item.total,
            tugas_selesai: item.selesai,
            persentase: item.persentase
        }));

        return { kpi, bar_chart, pie_chart, recent_activities, daily_checklist_ob: daily_checklist_ob_mapped };
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

        const currDibatalkan = current.filter(r => r.status === LAPORAN_STATUS.DIBATALKAN).length;
        const prevDibatalkan = previous.filter(r => r.status === LAPORAN_STATUS.DIBATALKAN).length;

        return {
            total_laporan: calculateTrend(currTotal, prevTotal),
            laporan_selesai: calculateTrend(currDone, prevDone),
            laporan_berjalan: calculateTrend(currOngoing, prevOngoing),
            laporan_dibatalkan: calculateTrend(currDibatalkan, prevDibatalkan)
        };
    }

    private calculatePieChart(reports: ReportSummaryPayload[]): PieChartResponse[] {
        const total = reports.length;

        const STATUS_LABEL_MAP: Record<LaporanStatus, string> = {
            [LAPORAN_STATUS.BELUM_DIKERJAKAN]: "Masuk",
            [LAPORAN_STATUS.SELESAI]: "Selesai",
            [LAPORAN_STATUS.PENDING]: "Menunggu",
            [LAPORAN_STATUS.DIBATALKAN]: "Dibatalkan",
        };

        const counts: Record<LaporanStatus, number> = {
            [LAPORAN_STATUS.BELUM_DIKERJAKAN]: 0,
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

        return Object.keys(counts).map(key => {
            const status = key as LaporanStatus;
            return {
                status,
                label: STATUS_LABEL_MAP[status],
                count: counts[status],
                percentage: total > 0 ? Math.round((counts[status] / total) * 100) : 0
            };
        });
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
            return orderedLabels
                .filter(label => label in groups || true)
                .map(label => ({ label, count: groups[label] || 0 }));
        }

        return Object.keys(groups).map(label => ({
            label,
            count: groups[label] || 0
        }));
    }

    public async getReportDetail(id: string): Promise<AdminReportDetailResponse> {
        const laporan = await this.laporanService.getReportDetailById(id);

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
            deskripsi_kendala: laporan.deskripsi_kendala,
            bukti_foto: {
                urls: laporan.status === "SELESAI"
                    ? (historiTerakhir?.foto_selesai ?? []).map(resolveFileUrl).filter((url): url is string => !!url)
                    : laporan.foto_masalah.map(resolveFileUrl).filter((url): url is string => !!url),
                diupload_oleh: laporan.ob?.nama_lengkap ?? null,
                jam_upload: jamUpload
            }
        };
    }

    async assignObToLocations(obId: string, lokasiIds: string[], bulan: number, tahun: number): Promise<void> {
        try {
            const obUser = await this.usersService.getByID(obId);
            if (!obUser) {
                throw new AppError("OB user tidak ditemukan", 404);
            }
            if (obUser.role?.nama_role?.toLowerCase() !== "ob") {
                throw new AppError("User bukan merupakan OB", 400);
            }

            await this.adminRepo.assignObToLocations(obId, lokasiIds, bulan, tahun);
        } catch (err) {
            throw handlePrismaError(err);
        }
    }

    async getPenugasanByPeriode(bulan: number, tahun: number): Promise<PenugasanObWithDetails[]> {
        try {
            return await this.adminRepo.getPenugasanByPeriode(bulan, tahun);
        } catch (err) {
            throw handlePrismaError(err);
        }
    }

    public async patchLaporan(laporanId: string, dto: PatchLaporanReq): Promise<void> {
        try {
            const laporan = await this.laporanService.getReportDetailById(laporanId);
            if (!laporan) throw new AppError("Laporan tidak ditemukan", 404);

            if (dto.ob_id) {
                const obUser = await this.usersService.getByID(dto.ob_id);
                if (!obUser || obUser.role?.nama_role !== "ob") {
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
            const laporan = await this.laporanService.getReportDetailById(laporanId);
            if (!laporan) throw new AppError("Laporan tidak ditemukan", 404);

            return await this.adminRepo.approveLaporan(laporanId, catatan);
        } catch (err) {
            throw handlePrismaError(err);
        }
    }

    async rejectLaporan(laporanId: string, catatan: string): Promise<Laporan_karyawan> {
        try {
            const laporan = await this.laporanService.getReportDetailById(laporanId);
            if (!laporan) throw new AppError("Laporan tidak ditemukan", 404);

            return await this.adminRepo.rejectLaporan(laporanId, catatan);
        } catch (err) {
            throw handlePrismaError(err);
        }
    }
}
