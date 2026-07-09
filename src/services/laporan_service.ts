import type { MappedReportDetailRes } from "../dto/users.js";
import type { ILaporanRepository } from "../repositories/laporan_repository.interface.js";
import type { LaporanPriority, LaporanStatus } from "../utils/constants.js";
import { handlePrismaError } from "../utils/error.js";
import { resolveFileUrl } from "../utils/url.js";
import { AppError } from "../utils/error.js";
import type { ILaporanService } from "./laporan_service.interface.js";

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

            const isOwner = role === "ob"
                ? item.ob_id === userId
                : item.pelapor_id === userId;

            if (!isOwner) {
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

}
