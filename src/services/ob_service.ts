import type { IObService } from "./ob_service.interface.js";
import type { IObRepository } from "../repositories/ob_repository.interface.js";
import type { ILaporanService } from "./laporan_service.interface.js";
import type { IUsersService } from "./users_service.interface.js";
import type { IChecklistHarianService } from "./checklistHarian_service.interface.js";
import type { ObHomeRes } from "../dto/ob.js";
import type { MappedProfileReport, MappedReportDetailRes, ObProfileResponse } from "../dto/users.js";
import type { PaginatedResponse } from "../dto/response.js";
import type { RiwayatParams } from "./karyawan_service.interface.js";
import { resolveFileUrl } from "../utils/url.js";
import { AppError, handlePrismaError } from "../utils/error.js";
import { CHECKLIST_STATUS, LAPORAN_PRIORITY, LAPORAN_STATUS, NOTIFICATION_TYPE, NOTIFICATION_TITLE, NOTIFICATION_MESSAGE, REF_TIPE, type LaporanPriority, type LaporanStatus, USER_ROLE } from "../utils/constants.js";
import type { ChecklistHarianWithDetails } from "../repositories/checklistHarian_repository.interface.js";
import type { LaporanKaryawanWithDetails } from "../repositories/laporan_repository.interface.js";

export class ObService implements IObService {
    private obRepo: IObRepository;
    private laporanService: ILaporanService;
    private checklistService: IChecklistHarianService;
    private usersService: IUsersService;

    constructor(
        obRepo: IObRepository,
        laporanService: ILaporanService,
        checklistService: IChecklistHarianService,
        usersService: IUsersService
    ) {
        this.obRepo = obRepo;
        this.laporanService = laporanService;
        this.checklistService = checklistService;
        this.usersService = usersService;
    }

    async getHomeStats(obId: string): Promise<ObHomeRes> {
        try {
            const obUser = await this.obRepo.getObById(obId);
            if (!obUser) {
                throw new AppError("OB user tidak ditemukan", 404);
            }

            const today = new Date();
            const [checklists, totalChecklists, reports] = await Promise.all([
                this.checklistService.getTodayChecklists(obId, today),
                this.checklistService.countTodayChecklists(obId, today),
                this.laporanService.getReportsForObDashboard(obId),
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

                const mapped = {
                    id: item.id,
                    nama_tugas: item.nama_tugas,
                    kategori: item.kategori?.nama_kategori || "",
                    lokasi: item.lantai?.lokasi?.nama_lokasi || "",
                    nomor_lantai: item.lantai?.nomor_lantai || 0,
                    status: item.status,
                    tanggal: item.tanggal instanceof Date ? item.tanggal.toISOString().split('T').at(0) ?? "" : String(item.tanggal ?? "")
                };
                return mapped;
            });

            const laporanMapped = reports.map((item: LaporanKaryawanWithDetails) => {
                const kategoriName = item.kategori?.nama_kategori || "";
                const deskripsi = item.deskripsi_kendala || "";
                const priority = item.prioritas === LAPORAN_PRIORITY.URGENT ? LAPORAN_PRIORITY.URGENT : LAPORAN_PRIORITY.STANDARD;

                const mapped = {
                    id: item.id,
                    kategori: kategoriName,
                    deskripsi_kendala: deskripsi,
                    status: item.status,
                    foto_masalah: (item.foto_masalah ?? []).map((f: string) => resolveFileUrl(f)).filter((url: string | null): url is string => url !== null),
                    lokasi: item.lantai?.lokasi?.nama_lokasi || "",
                    nomor_lantai: item.lantai?.nomor_lantai || 0,
                    priority,
                    is_kolaborasi_open: item.is_kolaborasi_open,
                    created_at: item.created_at instanceof Date ? item.created_at.toISOString() : String(item.created_at)
                };
                return mapped;
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

    async getProfile(obId: string): Promise<ObProfileResponse> {
        try {
            const user = await this.usersService.getByID(obId);
            if (!user) {
                throw new AppError("OB tidak ditemukan", 404);
            }

            const today = new Date();
            const bulan = today.getMonth() + 1;
            const tahun = today.getFullYear();

            const [obStats, penugasan] = await Promise.all([
                this.laporanService.getObPerformanceStats(obId),
                this.obRepo.getActiveAssignments(obId, bulan, tahun)
            ]);

            const lokasiAktif = penugasan.map((p) => ({
                id: p.lokasi.id,
                nama_lokasi: p.lokasi.nama_lokasi || "",
                status: "Aktif",
            }));

            const profile: ObProfileResponse = {
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

            return profile;
        } catch (err: unknown) {
            throw handlePrismaError(err);
        }
    }
}