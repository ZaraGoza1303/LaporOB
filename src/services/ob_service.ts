import type { IObService } from "./ob_service.interface.js";
import type { IObRepository, ChecklistHarianWithDetails, LaporanKaryawanWithDetails } from "../repositories/ob_repository.interface.js";
import type { ProfileReport } from "../repositories/laporan_repository.interface.js";
import type { ILaporanService } from "./laporan_service.interface.js";
import type { INotificationService } from "./notification_service.interface.js";
import type { NotificationData } from "../dto/notification.js";
import type { ObHomeRes, CreateHistoriReq } from "../dto/ob.js";
import type { MappedProfileReport, MappedReportDetailRes, ObProfileResponse } from "../dto/users.js";
import type { PaginatedResponse } from "../dto/response.js";
import type { PeriodRange } from "../utils/date.js";
import type { RiwayatParams } from "./karyawan_service.interface.js";
import { resolveFileUrl } from "../utils/url.js";
import { AppError, handlePrismaError } from "../utils/error.js";
import { CHECKLIST_STATUS, LAPORAN_PRIORITY, LAPORAN_STATUS, NOTIFICATION_TYPE, NOTIFICATION_TITLE, NOTIFICATION_MESSAGE, type LaporanPriority, type LaporanStatus, USER_ROLE } from "../utils/constants.js";

export class ObService implements IObService {
    private obRepo: IObRepository;
    private laporanService: ILaporanService;
    private notificationService: INotificationService;

    constructor(obRepo: IObRepository, laporanService: ILaporanService, notificationService: INotificationService) {
        this.obRepo = obRepo;
        this.laporanService = laporanService;
        this.notificationService = notificationService;
    }

    async getHomeStats(obId: string): Promise<ObHomeRes> {
        try {
            const obUser = await this.obRepo.getObById(obId);
            if (!obUser) {
                throw new AppError("OB user tidak ditemukan", 404);
            }

            const today = new Date();
            const [checklists, totalChecklists, reports] = await Promise.all([
                this.obRepo.getTodayChecklists(obId, today),
                this.obRepo.countTodayChecklists(obId, today),
                this.obRepo.getReports(obId)
            ]);

            let resolvedCount = 0;
            let pendingCount = 0;

            const tugasHarianMapped = checklists.map((item: ChecklistHarianWithDetails) => {
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
                    tanggal: item.tanggal instanceof Date ? item.tanggal.toISOString().split('T').at(0) ?? "" : String(item.tanggal ?? "")
                };
            });

            const laporanMapped = reports.map((item: LaporanKaryawanWithDetails) => {
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

        } catch (err: unknown) {
            handlePrismaError(err);
        }
    }
    async ambilLaporan(laporanId: string, obId: string): Promise<void> {
        try {
            const laporan = await this.laporanService.getReportDetailById(laporanId);
            if (!laporan) throw new AppError("Laporan tidak ditemukan", 404);

            if (laporan.ob_id && laporan.ob_id !== obId) {
                throw new AppError("Laporan sudah diambil oleh OB lain", 409);
            }

            await this.obRepo.ambilLaporan(laporanId, obId);

            const notifData: NotificationData = {
                penerima_id: laporan.pelapor_id,
                pengirim_id: obId,
                tipe: NOTIFICATION_TYPE.LAPORAN_DIKERJAKAN,
                judul: NOTIFICATION_TITLE.LAPORAN_DIKERJAKAN,
                pesan: NOTIFICATION_MESSAGE.LAPORAN_DIKERJAKAN,
            };
            await this.notificationService.sendNotification(notifData);
        } catch (err: unknown) {
            throw handlePrismaError(err);
        }
    }

    async ambilChecklist(checklistId: string, obId: string): Promise<void> {
        try {
            await this.obRepo.ambilChecklist(checklistId, obId);
        } catch (err: unknown) {
            throw handlePrismaError(err);
        }
    }

    async createHistoriPekerjaan(laporanId: string, fotoUrls: string[], dto: CreateHistoriReq, obId: string): Promise<void> {
        try {
            const laporan = await this.laporanService.getReportDetailById(laporanId);
            if (!laporan) throw new AppError("Laporan tidak ditemukan", 404);
            if (laporan.ob_id !== obId) throw new AppError("Hanya OB utama yang bisa menyelesaikan laporan", 403);

            await this.obRepo.createHistoriPekerjaan(laporanId, obId, fotoUrls, dto.catatan);

            const notifData: NotificationData = {
                penerima_id: laporan.pelapor_id,
                pengirim_id: obId,
                tipe: NOTIFICATION_TYPE.LAPORAN_BERES,
                judul: NOTIFICATION_TITLE.LAPORAN_BERES,
                pesan: dto.catatan,
            };
            await this.notificationService.sendNotification(notifData);
        } catch (err: unknown) {
            throw handlePrismaError(err);
        }
    }

    async tolakLaporan(laporanId: string, fotoUrls: string[], dto: CreateHistoriReq, obId: string): Promise<void> {
        try {
            const laporan = await this.laporanService.getReportDetailById(laporanId);
            if (!laporan) throw new AppError("Laporan tidak ditemukan", 404);
            if (laporan.ob_id !== obId) throw new AppError("Hanya OB utama yang bisa menolak laporan", 403);

            await this.obRepo.tolakLaporan(laporanId, obId, fotoUrls, dto.catatan);

            const notifData: NotificationData = {
                penerima_id: laporan.pelapor_id,
                pengirim_id: obId,
                tipe: NOTIFICATION_TYPE.LAPORAN_DITOLAK,
                judul: NOTIFICATION_TITLE.LAPORAN_DITOLAK,
                pesan: dto.catatan,
            };
            await this.notificationService.sendNotification(notifData);
        } catch (err: unknown) {
            throw handlePrismaError(err);
        }
    }

    async getProfile(obId: string): Promise<ObProfileResponse> {
        try {
            const user = await this.obRepo.getObById(obId);
            if (!user) {
                throw new AppError("OB tidak ditemukan", 404);
            }

            const today = new Date();
            const bulan = today.getMonth() + 1;
            const tahun = today.getFullYear();

            const [obStats, penugasan] = await Promise.all([
                this.getObPerformanceStats(obId),
                this.obRepo.getActiveAssignments(obId, bulan, tahun)
            ]);

            const lokasiAktif = penugasan.map((p) => ({
                id: p.lokasi.id,
                nama_lokasi: p.lokasi.nama_lokasi || "",
                status: "Aktif",
            }));

            return {
                id: user.id,
                nama_lengkap: user.nama_lengkap,
                username: user.username,
                email: user.email,
                role: user.role_id || USER_ROLE.OB,
                profile_picture: resolveFileUrl(user.profile_picture),
                laporanDiterima: obStats.laporanDiterima || 0,
                laporanSelesai: obStats.laporanSelesai || 0,
                lokasiAktif: lokasiAktif,
            };
        } catch (err: unknown) {
            throw handlePrismaError(err);
        }
    }

    async getRiwayat(obId: string, limit: number, params: RiwayatParams): Promise<PaginatedResponse<MappedProfileReport>> {
        try {
            const reportsData = await this.laporanService.getReportsByObId(obId, limit, params.cursor, params.search, params.status);

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
            const item = await this.laporanService.getReportDetailById(laporanId);
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
