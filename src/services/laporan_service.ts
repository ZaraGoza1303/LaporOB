import type { MappedReportDetailRes } from "../dto/users.js";
import type { PaginatedResponse } from "../dto/response.js";
import type { AdminLaporanQuery, PatchLaporanReq } from "../dto/admin.js";
import type { ILaporanRepository, RecentActivityPayload, ReportSummaryPayload, AdminLaporanPayload, RuanganTerpopulerPayload, DetailReportPayload, ProfileReport } from "../repositories/laporan_repository.interface.js";
import type { UserActivityRes } from "../dto/users.js";
import { USER_ROLE, LAPORAN_STATUS, type LaporanPriority, type LaporanStatus } from "../utils/constants.js";
import { handlePrismaError } from "../utils/error.js";
import { resolveFileUrl } from "../utils/url.js";
import { AppError } from "../utils/error.js";
import type { ILaporanService } from "./laporan_service.interface.js";
import type { Laporan_karyawanCreateInput } from "../generated/prisma/models.js";
import { Prisma } from "../generated/prisma/client.js";

export class LaporanService implements ILaporanService {
    private laporanRepo: ILaporanRepository;

    constructor(laporanRepo: ILaporanRepository) {
        this.laporanRepo = laporanRepo;
    }

    async getReportDetail(reportId: string, userId: string, role: string): Promise<MappedReportDetailRes> {
        try {
            const item = await this.laporanRepo.getReportDetailById(reportId);
            if (!item) {
                throw new AppError("Laporan tidak ditemukan", 404);
            }

            if (role !== USER_ROLE.OB || item.ob_id !== userId) {
                throw new AppError("Anda tidak memiliki akses ke laporan ini", 403);
            }

            const history = item.histori_pekerjaan?.[0];

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
                created_at: item.created_at instanceof Date ? item.created_at.toISOString() : String(item.created_at),
            };
            return detail;
        } catch (err) {
            handlePrismaError(err);
        }
    }

    async getReportDetailById(reportId: string): Promise<DetailReportPayload | null> {
        try {
            const detail = await this.laporanRepo.getReportDetailById(reportId);
            return detail;
        } catch (err) {
            handlePrismaError(err);
        }
    }

    async getRecentActivities(limit: number): Promise<RecentActivityPayload[]> {
        try {
            const activities = await this.laporanRepo.getRecentActivities(limit);
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

    async toggleKolaborasiOpen(laporanId: string, isOpen: boolean): Promise<void> {
        try {
            await this.laporanRepo.updateKolaborasiOpen(laporanId, isOpen);
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
}
