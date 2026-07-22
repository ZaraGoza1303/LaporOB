import type { MappedReportDetailRes, MappedProfileReport } from "../dto/users.js";
import type { PaginatedResponse } from "../dto/response.js";
import type { AdminLaporanHistoryQuery, AdminLaporanQuery, PatchLaporanReq } from "../dto/admin.js";
import type { ILaporanRepository, RecentActivityPayload, ReportSummaryPayload, AdminLaporanPayload, RuanganTerpopulerPayload, DetailReportPayload, ProfileReport, LaporanKaryawanWithDetails } from "../repositories/laporan_repository.interface.js";
import type { UserActivityRes } from "../dto/users.js";
import { USER_ROLE, LAPORAN_STATUS, NOTIFICATION_TYPE, NOTIFICATION_TITLE, NOTIFICATION_MESSAGE, REF_TIPE, type LaporanPriority, type LaporanStatus } from "../utils/constants.js";
import { handlePrismaError } from "../utils/error.js";
import { resolveFileUrl } from "../utils/url.js";
import { AppError } from "../utils/error.js";
import type { ILaporanService } from "./laporan_service.interface.js";
import type { Laporan_karyawanCreateInput } from "../generated/prisma/models.js";
import { Prisma, type Laporan_karyawan } from "../generated/prisma/client.js";
import type { PeriodRange } from "../utils/date.js";
import type { INotificationService } from "./notification_service.interface.js";
import type { IUsersService } from "./users_service.interface.js";
import type { ISkillService } from "./skill_service.interface.js";
import type { IAchievementService } from "./achievement_service.interface.js";
import type { NotificationData, BulkNotificationData } from "../dto/notification.js";
import type { ObPerformance } from "../dto/ob.js";

export class LaporanService implements ILaporanService {
    private laporanRepo: ILaporanRepository;
    private notificationService: INotificationService;
    private usersService: IUsersService;
    private skillService: ISkillService;
    private achievementService: IAchievementService;

    constructor(
        laporanRepo: ILaporanRepository,
        notificationService: INotificationService,
        usersService: IUsersService,
        skillService: ISkillService,
        achievementService: IAchievementService,
    ) {
        this.laporanRepo = laporanRepo;
        this.notificationService = notificationService;
        this.usersService = usersService;
        this.skillService = skillService;
        this.achievementService = achievementService;
    }

    async getReportDetail(reportId: string, obId?: string): Promise<MappedReportDetailRes> {
        try {
            const item = await this.laporanRepo.getReportDetailById(reportId);
            if (!item) {
                throw new AppError("Laporan tidak ditemukan", 404);
            }

            if (obId && item.ob_id !== obId) {
                throw new AppError("Anda tidak memiliki akses ke laporan ini", 403);
            }

            const history = item.histori_pekerjaan?.[0];

            let total_durasi: number | null = null;
            if (item.dikerjakan_at && item.selesai_at) {
                total_durasi = Math.floor((item.selesai_at.getTime() - item.dikerjakan_at.getTime()) / 1000);
            }

            const detail: MappedReportDetailRes = {
                id: item.id,
                kategori: item.kategori?.nama_kategori || "",
                deskripsi_kendala: item.deskripsi_kendala || "",
                status: item.status as LaporanStatus,
                prioritas: item.prioritas as LaporanPriority,
                foto_masalah: Array.isArray(item.foto_masalah) ? (item.foto_masalah as string[]).map(resolveFileUrl).filter((url): url is string => !!url) : [],
                foto_selesai: history && Array.isArray(history.foto_selesai) ? history.foto_selesai.map(resolveFileUrl).filter((url): url is string => !!url) : [],
                catatan: history?.catatan || "",
                lokasi: item.lantai?.lokasi?.nama_lokasi || "",
                nomor_lantai: item.lantai?.nomor_lantai || 0,
                nama_karyawan: item.pelapor?.nama_lengkap || "",
                nama_ob: item.ob?.nama_lengkap || null,
                is_kolaborasi_open: item.is_kolaborasi_open,
                catatan_kolaborasi: item.catatan_kolaborasi,
                dikerjakan_at: item.dikerjakan_at ? (item.dikerjakan_at instanceof Date ? item.dikerjakan_at.toISOString() : String(item.dikerjakan_at)) : null,
                selesai_at: item.selesai_at ? (item.selesai_at instanceof Date ? item.selesai_at.toISOString() : String(item.selesai_at)) : null,
                total_durasi,
                created_at: item.created_at instanceof Date ? item.created_at.toISOString() : String(item.created_at),
            };
            return detail;
        } catch (err) {
            handlePrismaError(err);
        }
    }

    async getReportDetailWithRelations(reportId: string): Promise<DetailReportPayload | null> {
        try {
            const detail = await this.laporanRepo.getReportDetailById(reportId);
            return detail;
        } catch (err) {
            handlePrismaError(err);
        }
    }

    async getRiwayat(obId: string, limit: number, cursor?: string | null, search?: string | null, status?: string | null): Promise<PaginatedResponse<MappedProfileReport>> {
        try {
            const reportsData = await this.laporanRepo.getReportsByObId(obId, limit, cursor, search, status);

            const items: MappedProfileReport[] = reportsData.items.map((item: ProfileReport) => {
                const mapped: MappedProfileReport = {
                    id: item.id,
                    kategori: item.kategori?.nama_kategori || "",
                    deskripsi_kendala: item.deskripsi_kendala || "",
                    status: item.status as LaporanStatus,
                    prioritas: item.prioritas as LaporanPriority,
                    foto_masalah: (item.foto_masalah ?? []).map((f: string) => resolveFileUrl(f)).filter((url): url is string => url !== null),
                    lokasi: item.lantai?.lokasi?.nama_lokasi || "",
                    nomor_lantai: item.lantai?.nomor_lantai || 0,
                    nama_ob: item.ob?.nama_lengkap || null,
                    created_at: item.created_at instanceof Date ? item.created_at.toISOString() : String(item.created_at),
                    updated_at: item.updated_at instanceof Date ? item.updated_at.toISOString() : String(item.updated_at)
                };
                return mapped;
            });

            const result: PaginatedResponse<MappedProfileReport> = {
                items,
                next_cursor: reportsData.next_cursor ?? null,
                meta: reportsData.meta ?? {
                    total_items: 0,
                    current_page: 1,
                    limit,
                    total_pages: 0
                }
            };
            return result;
        } catch (err) {
            handlePrismaError(err);
        }
    }

    async getRecentActivities(page: number, limit: number): Promise<PaginatedResponse<RecentActivityPayload>> {
        try {
            const activities = await this.laporanRepo.getRecentActivities(page, limit);
            return activities;
        } catch (err) {
            handlePrismaError(err);
        }
    }

    async getReportsByDateRange(startDate: Date, endDate: Date): Promise<ReportSummaryPayload[]> {
        try {
            const reports = await this.laporanRepo.getReportsByDateRange(startDate, endDate);
            return reports;
        } catch (err) {
            handlePrismaError(err);
        }
    }

    async getAllLaporan(page: number, limit: number, query: AdminLaporanQuery): Promise<PaginatedResponse<AdminLaporanPayload>> {
        try {
            const laporan = await this.laporanRepo.getAllLaporan(page, limit, query);
            return laporan;
        } catch (err) {
            handlePrismaError(err);
        }
    }
        
    async getAllHistoryLaporan(page: number, limit: number, query: AdminLaporanHistoryQuery): Promise<PaginatedResponse<Laporan_karyawan>> {
        try {
            const laporan = await this.laporanRepo.getAllHistoryLaporan(page, limit, query);
            return laporan;
        } catch (err) {
            handlePrismaError(err);
        }
    }

    async getRuanganTerpopuler(limit: number, query: AdminLaporanQuery): Promise<RuanganTerpopulerPayload[]> {
        try {
            const laporan = await this.laporanRepo.getRuanganTerpopuler(limit, query);
            const ruanganMap = new Map<string, RuanganTerpopulerPayload>();

            laporan.forEach((item: any) => {
                const ruanganId = item.ruangan?.id ?? null;
                const namaRuangan = item.ruangan?.nama ?? "Ruangan tidak diketahui";
                const nomorLantai = item.ruangan?.lantai?.nomor_lantai;
                const namaLantai = nomorLantai !== undefined ? `Lantai ${nomorLantai}` : "Lantai tidak diketahui";
                const namaLokasi = item.ruangan?.lantai?.lokasi?.nama_lokasi ?? "Lokasi tidak diketahui";
                const key = ruanganId ?? namaRuangan;
                const current = ruanganMap.get(key);

                ruanganMap.set(key, {
                    ruangan_id: ruanganId,
                    nama_ruangan: namaRuangan,
                    nama_lantai: namaLantai,
                    nama_lokasi: namaLokasi,
                    total_laporan: (current?.total_laporan ?? 0) + 1
                });
            });

            const result = Array.from(ruanganMap.values())
                .sort((a, b) => b.total_laporan - a.total_laporan)
                .slice(0, limit);
            return result;
        } catch (err) {
            handlePrismaError(err);
        }
    }

    async countLaporanAktif(query: AdminLaporanQuery): Promise<number> {
        try {
            const count = await this.laporanRepo.countLaporanAktif(query);
            return count;
        } catch (err) {
            handlePrismaError(err);
        }
    }

    async getActivity(userId: string): Promise<UserActivityRes[]> {
        try {
            const activity = await this.laporanRepo.getActivity(userId);
            return activity;
        } catch (err) {
            handlePrismaError(err);
        }
    }

    async insertReport(req: Laporan_karyawanCreateInput): Promise<string> {
        try {
            const reportId = await this.laporanRepo.insertReport(req);
            return reportId;
        } catch (err) {
            handlePrismaError(err);
        }
    }

    async getReportsByUserId(userId: string, limit: number, cursor?: string | null, search?: string | null, status?: string | null): Promise<PaginatedResponse<ProfileReport>> {
        try {
            const reports = await this.laporanRepo.getReportsByUserId(userId, limit, cursor, search, status);
            return reports;
        } catch (err) {
            handlePrismaError(err);
        }
    }

    async getReportsByObId(obId: string, limit: number, cursor?: string | null, search?: string | null, status?: string | null): Promise<PaginatedResponse<ProfileReport>> {
        try {
            const reports = await this.laporanRepo.getReportsByObId(obId, limit, cursor, search, status);
            return reports;
        } catch (err) {
            handlePrismaError(err);
        }
    }

    async patchLaporan(laporanId: string, dto: PatchLaporanReq): Promise<void> {
        try {
            const now = new Date();
            const data = {} as Prisma.Laporan_karyawanUncheckedUpdateInput;

            if (dto.status != null) {
                data.status = dto.status;

                if (dto.status === LAPORAN_STATUS.PENDING) {
                    data.dikerjakan_at = now;
                } else if (dto.status === LAPORAN_STATUS.SELESAI) {
                    data.selesai_at = now;
                } else if (dto.status === LAPORAN_STATUS.DIBATALKAN) {
                    data.dibatalkan_at = now;
                    data.ob_id = null;
                } else if (dto.status === LAPORAN_STATUS.BELUM_DIKERJAKAN) {
                    data.ob_id = null;
                    data.dikerjakan_at = null;
                }
            }

            if (dto.prioritas != null) data.prioritas = dto.prioritas;
            if (dto.ob_id !== undefined && dto.status !== LAPORAN_STATUS.BELUM_DIKERJAKAN && dto.status !== LAPORAN_STATUS.DIBATALKAN) {
                data.ob_id = dto.ob_id;
            }
            if (dto.admin_catatan !== undefined) data.admin_catatan = dto.admin_catatan;
            if (dto.lantai_id !== undefined) data.lantai_id = dto.lantai_id ?? undefined;
            if (dto.ruangan_id !== undefined) data.ruangan_id = dto.ruangan_id ?? undefined;

            await this.laporanRepo.patchLaporan(laporanId, data);
        } catch (err) {
            handlePrismaError(err);
        }
    }

    async toggleKolaborasiOpen(laporanId: string, obId: string, isOpen: boolean, catatan?: string): Promise<void> {
        try {
            const laporan = await this.laporanRepo.getReportDetailById(laporanId);
            if (!laporan) throw new AppError("Laporan tidak ditemukan", 404);
            if (laporan.ob_id !== obId) throw new AppError("Hanya OB pemilik laporan yang bisa mengatur kolaborasi", 403);

            await this.laporanRepo.updateKolaborasiOpen(laporanId, isOpen, catatan);

            if (isOpen) {
                const obUsers = await this.usersService.getByRole(USER_ROLE.OB);
                const otherObIds = obUsers
                    .filter((u) => u.id !== obId)
                    .map((u) => u.id);

                if (otherObIds.length > 0) {
                    const bulkNotif: BulkNotificationData = {
                        penerima_ids: otherObIds,
                        pengirim_id: obId,
                        tipe: NOTIFICATION_TYPE.KOLABORASI_DIBUKA,
                        judul: NOTIFICATION_TITLE.KOLABORASI_DIBUKA,
                        pesan: NOTIFICATION_MESSAGE.KOLABORASI_DIBUKA,
                        ref_id: laporanId,
                        ref_tipe: REF_TIPE.KOLABORASI,
                    };
                    await this.notificationService.sendBulkNotification(bulkNotif);
                }
            }
        } catch (err) {
            handlePrismaError(err);
        }
    }

    async getLaporanCountByUserId(userId: string): Promise<number> {
        try {
            const count = await this.laporanRepo.getLaporanCountByUserId(userId);
            return count;
        } catch (err) {
            handlePrismaError(err);
        }
    }

    async deleteLaporan(laporanId: string): Promise<void> {
        try {
            await this.laporanRepo.deleteLaporan(laporanId);
        } catch (err) {
            handlePrismaError(err);
        }
    }

    async getReportsForObDashboard(obId: string): Promise<LaporanKaryawanWithDetails[]> {
        try {
            const reports = await this.laporanRepo.getReportsForObDashboard(obId);
            return reports;
        } catch (err) {
            handlePrismaError(err);
        }
    }

    async ambilLaporan(laporanId: string, obId: string): Promise<void> {
        try {
            const laporan = await this.laporanRepo.getReportDetailById(laporanId);
            if (!laporan) throw new AppError("Laporan tidak ditemukan", 404);
            if (laporan.ob_id && laporan.ob_id !== obId) {
                throw new AppError("Laporan sudah diambil oleh OB lain", 409);
            }

            await this.laporanRepo.ambilLaporan(laporanId, obId);

            const notifData: NotificationData = {
                penerima_id: laporan.pelapor_id,
                pengirim_id: obId,
                tipe: NOTIFICATION_TYPE.LAPORAN_DIKERJAKAN,
                judul: NOTIFICATION_TITLE.LAPORAN_DIKERJAKAN,
                pesan: NOTIFICATION_MESSAGE.LAPORAN_DIKERJAKAN,
                ref_id: laporanId,
                ref_tipe: REF_TIPE.LAPORAN,
            };
            await this.notificationService.sendNotification(notifData);
        } catch (err) {
            handlePrismaError(err);
        }
    }

    async createHistoriPekerjaan(laporanId: string, fotoUrls: string[], catatan: string, obId: string): Promise<void> {
        try {
            const laporan = await this.laporanRepo.getReportDetailById(laporanId);
            if (!laporan) throw new AppError("Laporan tidak ditemukan", 404);
            if (laporan.ob_id !== obId) throw new AppError("Hanya OB utama yang bisa menyelesaikan laporan", 403);

            await this.laporanRepo.createHistoriSelesai(laporanId, obId, fotoUrls, catatan);

            await this.skillService.prosesSkillOtomatisForOb(obId);
            await this.achievementService.prosesOtomatisUntukOb(obId);

            const notifData: NotificationData = {
                penerima_id: laporan.pelapor_id,
                pengirim_id: obId,
                tipe: NOTIFICATION_TYPE.LAPORAN_BERES,
                judul: NOTIFICATION_TITLE.LAPORAN_BERES,
                pesan: catatan,
                ref_id: laporanId,
                ref_tipe: REF_TIPE.LAPORAN,
            };
            await this.notificationService.sendNotification(notifData);
        } catch (err) {
            handlePrismaError(err);
        }
    }

    async batalkanLaporan(laporanId: string, fotoUrls: string[], catatan: string, obId: string): Promise<void> {
        try {
            const laporan = await this.laporanRepo.getReportDetailById(laporanId);
            if (!laporan) throw new AppError("Laporan tidak ditemukan", 404);
            if (laporan.ob_id !== obId) throw new AppError("Hanya OB utama yang bisa membatalkan laporan", 403);

            await this.laporanRepo.batalkanLaporan(laporanId, obId, fotoUrls, catatan);

            const notifData: NotificationData = {
                penerima_id: laporan.pelapor_id,
                pengirim_id: obId,
                tipe: NOTIFICATION_TYPE.LAPORAN_DIBATALKAN,
                judul: NOTIFICATION_TITLE.LAPORAN_DIBATALKAN,
                pesan: catatan,
                ref_id: laporanId,
                ref_tipe: REF_TIPE.LAPORAN,
            };
            await this.notificationService.sendNotification(notifData);
        } catch (err) {
            handlePrismaError(err);
        }
    }

    async approveLaporan(laporanId: string, catatan?: string): Promise<Laporan_karyawan> {
        try {
            const laporan = await this.laporanRepo.approveLaporan(laporanId, catatan);
            return laporan;
        } catch (err) {
            throw handlePrismaError(err);
        }
    }

    async rejectLaporan(laporanId: string, catatan: string): Promise<Laporan_karyawan> {
        try {
            const laporan = await this.laporanRepo.rejectLaporan(laporanId, catatan);
            return laporan;
        } catch (err) {
            throw handlePrismaError(err);
        }
    }

    async getObPerformanceStats(obId: string): Promise<ObPerformance> {
        try {
            const stats = await this.laporanRepo.getObPerformanceStats(obId);
            return stats;
        } catch (err) {
            handlePrismaError(err);
        }
    }
}