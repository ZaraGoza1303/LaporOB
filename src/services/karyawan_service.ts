import type { CreateLaporanKaryawanInput, UserHomeRes, MappedProfileReport, ProfileRes } from "../dto/users.js";
import { LAPORAN_STATUS, NOTIFICATION_TITLE, NOTIFICATION_TYPE, REF_TIPE, USER_ROLE, type LaporanPriority, type LaporanStatus } from "../utils/constants.js";
import type { Laporan_karyawanCreateInput } from "../generated/prisma/models.js";
import type { IUsersService } from "./users_service.interface.js";
import type { ILaporanService } from "./laporan_service.interface.js";
import type { ProfileReport } from "../repositories/laporan_repository.interface.js";
import { AppError, handlePrismaError } from "../utils/error.js";
import { resolveFileUrl } from "../utils/url.js";
import type { IKaryawanService, RiwayatParams } from "./karyawan_service.interface.js";
import type { IKategoriService } from "./kategori_service.interface.js";
import type { PaginatedResponse } from "../dto/response.js";
import type { INotificationService } from "./notification_service.interface.js";
import type { BulkNotificationData } from "../dto/notification.js";
import type { KaryawanPerformanceRes } from "../dto/karyawan.js";

export class KaryawanService implements IKaryawanService {
    private usersService: IUsersService;
    private laporanService: ILaporanService;
    private kategoriService: IKategoriService;
    private notificationService: INotificationService

    constructor(
        usersService: IUsersService,
        laporanService: ILaporanService,
        kategoriService: IKategoriService,
        notificationService: INotificationService,
        ) {
        this.usersService = usersService;
        this.laporanService = laporanService;
        this.kategoriService = kategoriService;
        this.notificationService = notificationService;
    }

    async getKaryawanPerformanceStats(userId: string): Promise<KaryawanPerformanceRes> {
        try {
            const laporan_count = await this.laporanService.getLaporanCountByUserId(userId);
            const stats: KaryawanPerformanceRes = {
                laporan_terkirim: laporan_count
            };
            return stats;
        } catch (err) {
            handlePrismaError(err)
        }
    }

    async getHomeStats(userId: string): Promise<UserHomeRes> {
        try {
            const karyawanUser = await this.usersService.getByID(userId);
            if (!karyawanUser) {
                throw new AppError("Karyawan tidak ditemukan", 404)
            }

            const activity = await this.laporanService.getActivity(userId);
            const activityMapped = activity.map((item) => {
                const mapped = {
                    id: item.id,
                    deskripsi_kendala: item.deskripsi_kendala,
                    status: item.status as LaporanStatus,
                    foto_masalah: item.foto_masalah,
                    lokasi: item.lantai?.lokasi?.nama_lokasi ?? "",
                    nomor_lantai: item.lantai?.nomor_lantai ?? 0,
                    created_at: item.created_at ? item.created_at.toISOString() : ""
                };
                return mapped;
            })

            const kategori = await this.kategoriService.getKategoriLimit(6);

            const response: UserHomeRes = {
                karyawan: {
                    nama_lengkap: karyawanUser?.nama_lengkap
                },
                kategori: kategori,
                acitivity: activityMapped
            }

            return response;
        } catch (err) {
            handlePrismaError(err)
        }
    }

    async createReport(userId: string, req: CreateLaporanKaryawanInput): Promise<void> {
        try {
            const laporanReq: Laporan_karyawanCreateInput = {
                pelapor: {
                    connect: { id: userId }
                },
                lantai: {
                    connect: { id: req.lantai_id }
                },
                ruangan: {
                    connect: { id: req.ruangan_id }
                },
                kategori: {
                    connect: { id: req.kategori_id }
                },

                deskripsi_kendala: req.deskripsi_kendala,
                prioritas: req.prioritas,
                foto_masalah: req.foto_masalah,
                status: LAPORAN_STATUS.BELUM_DIKERJAKAN,
            };

            const laporanId = await this.laporanService.insertReport(laporanReq);
            const allOB = await this.usersService.getByRole(USER_ROLE.OB);
            
            const notifReq: BulkNotificationData = {
                penerima_ids: allOB.map(ob => ob.id),
                pengirim_id: userId,
                tipe: NOTIFICATION_TYPE.LAPORAN_BARU,
                judul: NOTIFICATION_TITLE.LAPORAN_BARU,
                ref_id: laporanId,
                ref_tipe: REF_TIPE.LAPORAN,
            }

            await this.notificationService.sendBulkNotification(notifReq)
            
        } catch (err) {
            handlePrismaError(err);
        }
    }

    async getRiwayat(userId: string, limit: number, params: RiwayatParams): Promise<PaginatedResponse<MappedProfileReport>> {
        try {
            const reportsData = await this.laporanService.getReportsByUserId(userId, limit, params.cursor, params.search, params.status);

            const laporanMapped: MappedProfileReport[] = reportsData.items.map((item: ProfileReport) => {
                const mapped = {
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
                items: laporanMapped,
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
}
