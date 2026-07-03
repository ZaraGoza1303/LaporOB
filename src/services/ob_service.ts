import type { IObService } from "./ob_service.interface.js";
import type { IObRepository } from "../repositories/ob_repository.interface.js";
import type { ObHomeRes, UpdateLaporanReq } from "../dto/ob.js";
import { resolveFileUrl } from "../utils/url.js";
import { handlePrismaError } from "../utils/error.js";
import type { Laporan_karyawan } from "../generated/prisma/client.js";
import type strict from "node:assert/strict";

export class ObService implements IObService {
    private obRepo: IObRepository;

    constructor(obRepo: IObRepository) {
        this.obRepo = obRepo;
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
                const isResolved = statusLower === "resolved" || statusLower === "selesai" || statusLower === "complete" || statusLower === "sukses";

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
                const priority: "URGENT" | "STANDARD" = item.prioritas === "URGENT" ? "URGENT" : "STANDARD";

                return {
                    id: item.id,
                    kategori: kategoriName,
                    deskripsi_kendala: deskripsi,
                    status: item.status,
                    foto_masalah: resolveFileUrl(item.foto_masalah),
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
    async updatelaporStatus(laporanId: string, obId: string, dto: UpdateLaporanReq): Promise<void> {
        try {
            const payload: {catatan?: string; foto_masalah?: string} = {}
            if (dto.keterangan) payload.catatan = dto.keterangan;
            if (dto.foto) payload.foto_masalah = dto.foto;
            
            await this.obRepo.updateLaporStatus( laporanId, obId, dto.status, payload);
        }catch (err: any) {
            throw handlePrismaError(err);
        }
    }
}
