import type { AdminLaporanItemResponse, AdminLaporanPageResponse, AdminLaporanQuery, UserStatsRes, ReportSummaryPayload, AdminReportDetailResponse, DailyChecklistObResponse } from "../dto/admin.js";
import type { DashboardMainResponse, GetDashboardQuery, RecentLaporanResponse, StatDetail, BarChartResponse, PieChartResponse } from "../dto/admin.js";
import type { IAdminRepository } from "../repositories/admin_repository.interface.js";
import type { IObRepository } from "../repositories/ob_repository.interface.js";
import { AppError, handlePrismaError } from "../utils/error.js";
import { calculateDateRanges } from "../utils/date.js";
import { LAPORAN_STATUS, type LaporanPriority, type LaporanStatus } from "../utils/constants.js";
import { resolveFileUrl } from "../utils/url.js";
import type { IAdminService } from "./admin_service.interface.js";

export class AdminService implements IAdminService {
    private obRepo: IObRepository;
    private adminRepo: IAdminRepository;

    constructor(adminRepo: IAdminRepository, obRepo: IObRepository) {
        this.adminRepo = adminRepo;
        this.obRepo = obRepo;
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
            const [laporanData, lokasiTerpopuler, totalLaporanAktif, recentActivities] = await Promise.all([
                this.adminRepo.getAllLaporan(page, limit, query),
                this.adminRepo.getLokasiTerpopuler(6, query),
                this.adminRepo.countLaporanAktif(query),
                this.adminRepo.getRecentActivities(5)
            ]);

            const laporanMapped: AdminLaporanItemResponse[] = laporanData.items.map((item, index) => {
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

        const recent_laporan = recentActivities.map(
            (activity) => ({
                id_laporan: activity.id,
                nama_karyawan: activity.pelapor?.nama_lengkap ?? "Anonim",
                lokasi: activity.lantai?.lokasi
                    ? `${activity.lantai.lokasi.nama_lokasi} Lantai ${activity.lantai.nomor_lantai}`
                    : "Lokasi tidak diketahui",
                prioritas: activity.prioritas as LaporanPriority,
                status: activity.status as LaporanStatus,
            })
        );

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
                lokasi_terpopuler: lokasiTerpopuler,
                laporan_aktif: {
                    total_laporan: totalLaporanAktif
                },
                recent_laporan
            };
        } catch (err) {
            handlePrismaError(err);
        }
    }

   public async getDashboardData(query: GetDashboardQuery): Promise<DashboardMainResponse> {
    const { range } = query;

    const rangeToPeriodMap: Record<string, 'weekly' | 'monthly' | 'yearly'> = {
        mingguan: 'weekly',
        bulanan: 'monthly',
        tahunan: 'yearly',
    };
    const period = rangeToPeriodMap[range] ?? 'weekly';

    const { current_start, current_end, previous_start, previous_end } = calculateDateRanges(period);

    const [rawActivities, currentReports, previousReports, dailyChecklist] = await Promise.all([
        this.adminRepo.getRecentActivities(5),
        this.adminRepo.getReportsByDateRange(current_start, current_end),
        this.adminRepo.getReportsByDateRange(previous_start, previous_end),
        this.adminRepo.getDailyChecklistOb()
    ]);

    const kpi = this.calculateKpi(currentReports, previousReports);
    const pie_chart = this.calculatePieChart(currentReports);
    const bar_chart = this.calculateBarChart(currentReports, period);

    const recent_laporan: RecentLaporanResponse[] = rawActivities.map(
        (item) => ({
            id_laporan: item.id,
            nama_karyawan: item.pelapor?.nama_lengkap ?? "Anonim",
            lokasi: item.lantai?.lokasi
                ? `${item.lantai.lokasi.nama_lokasi} Lantai ${item.lantai.nomor_lantai}`
                : "Lokasi tidak diketahui",
            prioritas: item.prioritas as LaporanPriority,
            status: item.status as LaporanStatus,
        })
    );

    const daily_checklist_ob: DailyChecklistObResponse[] = dailyChecklist.map((item) => ({
        nama_ob: item.nama_ob,
        total_tugas: item.total_tugas,
        tugas_selesai: item.tugas_selesai,
        persentase: item.total_tugas > 0
            ? Math.round((item.tugas_selesai / item.total_tugas) * 100)
            : 0
    }));

    return { kpi, bar_chart, pie_chart, recent_laporan, daily_checklist_ob };
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

    const currRejected = current.filter(r => r.status === LAPORAN_STATUS.DITOLAK).length;
    const prevRejected = previous.filter(r => r.status === LAPORAN_STATUS.DITOLAK).length;

    return {
        total_laporan: calculateTrend(currTotal, prevTotal),
        laporan_selesai: calculateTrend(currDone, prevDone),
        laporan_berjalan: calculateTrend(currOngoing, prevOngoing),
        laporan_ditolak: calculateTrend(currRejected, prevRejected)
    };
}

    private calculatePieChart(reports: ReportSummaryPayload[]): PieChartResponse[] {
    const total = reports.length;

    const STATUS_LABEL_MAP: Record<LaporanStatus, string> = {
        [LAPORAN_STATUS.BELUM_DIKERJAKAN]: "Masuk",
        [LAPORAN_STATUS.SELESAI]: "Selesai",
        [LAPORAN_STATUS.PENDING]: "Menunggu",
        [LAPORAN_STATUS.DITOLAK]: "Ditolak",
    };

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

        if (period === 'weekly') {
            label = DAY_LABELS[date.getDay()] ?? '';
        } else if (period === 'monthly') {
            label = `Mgg ${Math.ceil(date.getDate() / 7)}`;
        } else {
            label = date.toLocaleDateString('id-ID', { month: 'short' });
        }

        groups[label] = (groups[label] || 0) + 1;
    });

    if (period === 'weekly') {
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
            urls: laporan.status === "SELESAI"
                ? (historiTerakhir?.foto_selesai ?? []).map(resolveFileUrl).filter((url): url is string => !!url)
                : laporan.foto_masalah.map(resolveFileUrl).filter((url): url is string => !!url),
            diupload_oleh: laporan.ob?.nama_lengkap ?? null,
            jam_upload: jamUpload
        }
    };
}
}
