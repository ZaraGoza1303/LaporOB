import type { MappedReportDetailRes } from "../dto/users.js";
import type { ILaporanRepository } from "../repositories/laporan_repository.interface.js";
import { handlePrismaError } from "../utils/error.js";
import { resolveFileUrl } from "../utils/url.js";
import type { ILaporanService } from "./laporan_service.interface.js";

export class LaporanService implements ILaporanService {
    private laporanRepo: ILaporanRepository;

    constructor(laporanRepo: ILaporanRepository) {
        this.laporanRepo = laporanRepo;
    }

    async getReportDetail(reportId: string): Promise<MappedReportDetailRes> {
        try {
            const item = await this.laporanRepo.getReportDetailById(reportId);
            if (!item) {
                throw new Error("Laporan tidak ditemukan");
            }

            return {
                id: item.id,
                kategori: item.kategori?.nama_kategori || "",
                deskripsi_kendala: item.deskripsi_kendala || "",
                status: item.status,
                prioritas: item.prioritas,
                foto_masalah: Array.isArray(item.foto_masalah) ? (item.foto_masalah as string[]).map(resolveFileUrl).filter((url): url is string => !!url) : [],
                foto_selesai: Array.isArray((item as any).foto_selesai) ? ((item as any).foto_selesai as string[]).map(resolveFileUrl).filter((url): url is string => !!url) : [],
                catatan: (item as any).catatan_ob || "",
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
