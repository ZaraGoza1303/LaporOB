import type { IObService } from "./ob_service.interface.js";
import type { IObRepository } from "../repositories/ob_repository.interface.js";
import type { ObDashboardRes } from "../dto/ob.js";
import { resolveFileUrl } from "../utils/url.js";
import { handlePrismaError } from "../utils/error.js";

export class ObService implements IObService {
    private obRepo: IObRepository;

    constructor(obRepo: IObRepository) {
        this.obRepo = obRepo;
    }

    async getHomeStats(obId: string): Promise<ObDashboardRes> {
        try {
            const obUser = await this.obRepo.getObById(obId);
            if (!obUser) {
                throw new Error("OB user tidak ditemukan");
            }

            const today = new Date();
            const checklists = await this.obRepo.getTodayChecklists(obId, today);

            const reports = await this.obRepo.getReports(obId);

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

            const response: ObDashboardRes = {
                ob: {
                    id: obUser.id,
                    nama_lengkap: obUser.nama_lengkap,
                    username: obUser.username,
                    email: obUser.email,
                    profile_picture: resolveFileUrl(obUser.profile_picture)
                },
                tugas_harian_stats: {
                    total: checklists.length,
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
}
