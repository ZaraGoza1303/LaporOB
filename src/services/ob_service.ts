import type { IObService } from "./ob_service.interface.js";
import type { IObRepository } from "../repositories/ob_repository.interface.js";
import type { ILaporanRepository, ProfileReport } from "../repositories/laporan_repository.interface.js";
import type { INotificationService } from "./notification_service.interface.js";
import type { NotificationData } from "../dto/notification.js";
import type { ObHomeRes, CreateHistoriReq } from "../dto/ob.js";
import type { MappedProfileReport, MappedReportDetailRes } from "../dto/users.js";
import type { PaginatedResponse } from "../dto/response.js";
import type { PeriodRange } from "../utils/date.js";
import { resolveFileUrl } from "../utils/url.js";
import { AppError, handlePrismaError } from "../utils/error.js";
import { CHECKLIST_STATUS, LAPORAN_PRIORITY, NOTIFICATION_TYPE, NOTIFICATION_TITLE, NOTIFICATION_MESSAGE, type LaporanPriority, type LaporanStatus } from "../utils/constants.js";

export class ObService implements IObService {
    private obRepo: IObRepository;
    private laporanRepo: ILaporanRepository;
    private notificationService: INotificationService;

    constructor(obRepo: IObRepository, laporanRepo: ILaporanRepository, notificationService: INotificationService) {
        this.obRepo = obRepo;
        this.laporanRepo = laporanRepo;
        this.notificationService = notificationService;
    }

    async getHomeStats(obId: string): Promise<ObHomeRes> {
        try {
            const obUser = await this.obRepo.getObById(obId);
            if (!obUser) {
                throw new Error("OB user tidak ditemukan");
            }

            const today = new Date();
            const [checklists, totalChecklists, reports] = await Promise.all([
                this.obRepo.getTodayChecklists(obId, today),
                this.obRepo.countTodayChecklists(obId, today),
                this.obRepo.getReports(obId)
            ]);

            let resolvedCount = 0;
            let pendingCount = 0;

            const tugasHarianMapped = checklists.map((item: any) => {
                const statusLower = (item.status || "").toLowerCase();
                const isResolved = statusLower === "resolved" || statusLower === CHECKLIST_STATUS.SELESAI.toLowerCase() || statusLower === "complete" || statusLower === "sukses";

                if (isResolved) {
                    resolvedCount++;
                } else {
                    pendingCount++;
                }

                return {
                    id: item.id,
                    nama_tugas: item.tugas?.nama_tugas || "",
                    kategori: item.kategori?.nama_kategori || "",
                    lokasi: item.lantai?.lokasi?.nama_lokasi || "",
                    nomor_lantai: item.lantai?.nomor_lantai || 0,
                    status: item.status,
                    tanggal: item.tanggal instanceof Date ? item.tanggal.toISOString().split('T')[0] : String(item.tanggal)
                };
            });

            const laporanMapped = reports.map((item: any) => {
                const kategoriName = item.kategori?.nama_kategori || "";
                const deskripsi = item.deskripsi_kendala || "";
                const priority = item.prioritas === LAPORAN_PRIORITY.URGENT ? LAPORAN_PRIORITY.URGENT : LAPORAN_PRIORITY.STANDARD;

                return {
                    id: item.id,
                    kategori: kategoriName,
                    deskripsi_kendala: deskripsi,
                    status: item.status,
                    foto_masalah: (item.foto_masalah ?? []).map((f: string) => resolveFileUrl(f)).filter((url: string | null): url is string => url !== null),
                    lokasi: item.lantai?.lokasi?.nama_lokasi || "",
                    nomor_lantai: item.lantai?.nomor_lantai || 0,
                    priority,
                    created_at: item.created_at instanceof Date ? item.created_at.toISOString() : String(item.created_at)
                };
            });

            const response: ObHomeRes = {
                ob: {
                    nama_lengkap: obUser.nama_lengkap,
                },
                tugas_harian_stats: {
                    total: totalChecklists,
                    resolved: resolvedCount,
                    pending: pendingCount
                },
                tugas_harian: tugasHarianMapped,
                laporan: laporanMapped
            }

            return response;

        } catch (err: any) {
            handlePrismaError(err);
        }
    }
    async ambilLaporan(laporanId: string, obId: string): Promise<void> {
        try {
            const laporan = await this.laporanRepo.getReportDetailById(laporanId);
            if (!laporan) throw new AppError("Laporan tidak ditemukan", 404);

            await this.obRepo.ambilLaporan(laporanId, obId);

            const notifData: NotificationData = {
                penerima_id: laporan.pelapor_id,
                pengirim_id: obId,
                tipe: NOTIFICATION_TYPE.LAPORAN_DIKERJAKAN,
                judul: NOTIFICATION_TITLE.LAPORAN_DIKERJAKAN,
                pesan: NOTIFICATION_MESSAGE.LAPORAN_DIKERJAKAN,
            };
            await this.notificationService.sendNotification(notifData);
        } catch (err: any) {
            throw handlePrismaError(err);
        }
    }

    async createHistoriPekerjaan(laporanId: string, fotoUrls: string[], dto: CreateHistoriReq, obId: string): Promise<void> {
        try {
            const laporan = await this.laporanRepo.getReportDetailById(laporanId);
            if (!laporan) throw new AppError("Laporan tidak ditemukan", 404);

            await this.obRepo.createHistoriPekerjaan(laporanId, fotoUrls, dto.catatan);

            const notifData: NotificationData = {
                penerima_id: laporan.pelapor_id,
                pengirim_id: obId,
                tipe: NOTIFICATION_TYPE.LAPORAN_BERES,
                judul: NOTIFICATION_TITLE.LAPORAN_BERES,
                pesan: dto.catatan,
            };
            await this.notificationService.sendNotification(notifData);
        } catch (err: any) {
            throw handlePrismaError(err);
        }
    }

    async tolakLaporan(laporanId: string, fotoUrls: string[], dto: CreateHistoriReq, obId: string): Promise<void> {
        try {
            const laporan = await this.laporanRepo.getReportDetailById(laporanId);
            if (!laporan) throw new AppError("Laporan tidak ditemukan", 404);

            await this.obRepo.tolakLaporan(laporanId, fotoUrls, dto.catatan);

            const notifData: NotificationData = {
                penerima_id: laporan.pelapor_id,
                pengirim_id: obId,
                tipe: NOTIFICATION_TYPE.LAPORAN_DITOLAK,
                judul: NOTIFICATION_TITLE.LAPORAN_DITOLAK,
                pesan: dto.catatan,
            };
            await this.notificationService.sendNotification(notifData);
        } catch (err: any) {
            throw handlePrismaError(err);
        }
    }

   async getProfile(obId: string): Promise<{
        id: string;
        nama_lengkap: string;
        username: string;
        email: string;
        role: string;
        profile_picture: string | null;
        laporanDiterima: number;
        laporanSelesai: number;

    }> {
        try {
            const user = await this.obRepo.getObById(obId);
            if (!user) {
                throw new Error("OB tidak ditemukan");
            }

            const obStats = await this.getObPerformanceStats(obId);

            return {
                id: user.id,
                nama_lengkap: user.nama_lengkap,
                username: user.username,
                email: user.email,
                role: user.role_id || "OB",
                profile_picture: resolveFileUrl(user.profile_picture),
                laporanDiterima: obStats.laporanDiterima || 0,
                laporanSelesai: obStats.laporanSelesai || 0,
            };
        } catch (err: any) {
            handlePrismaError(err);
        }
    }

    async getRiwayat(obId: string, limit: number, params: { cursor?: string | null; search?: string | null; status?: string | null }): Promise<PaginatedResponse<MappedProfileReport>> {
        try {
            const reportsData = await this.laporanRepo.getReportsByObId(obId, limit, params.cursor, params.search, params.status);

            const laporanMapped: MappedProfileReport[] = reportsData.items.map((item: ProfileReport) => {
                return {
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
            });

            return {
                items: laporanMapped,
                next_cursor: reportsData.next_cursor ?? null,
                meta: reportsData.meta ?? {
                    total_items: 0,
                    current_page: 1,
                    limit,
                    total_pages: 0
                }
            };
        } catch (err) {
            handlePrismaError(err);
        }
    }

   
    async getDetailRiwayat(obId: string, laporanId: string): Promise<MappedReportDetailRes> {
        try {
            const item = await this.laporanRepo.getReportDetailById(laporanId);
            if (!item) {
                throw new AppError("Laporan tidak ditemukan", 404);
            }

            if (item.ob_id !== obId) {
                throw new AppError("Anda tidak memiliki akses ke laporan ini", 403);
            }

            const history = item.histori_pekerjaan?.[0];

            return {
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
                created_at: item.created_at instanceof Date ? item.created_at.toISOString() : String(item.created_at),
            };
        } catch (err) {
            handlePrismaError(err);
        }
    }
 async getObPerformanceStats(obId: string, dateRange?: PeriodRange): Promise<{ laporanDiterima: number, laporanSelesai: number }> {
        try {
            return await this.obRepo.getObPerformanceStats(obId, dateRange);
        } catch (err) {
            throw handlePrismaError(err);
        }
    }
}
