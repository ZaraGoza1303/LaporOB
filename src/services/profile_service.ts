import type { ProfileRes, MappedProfileReport, GetProfileReq, MappedReportDetailRes } from "../dto/profile.js";
import type { IProfileRepository, ProfileReport } from "../repositories/profile_repository.interface.js";
import { handlePrismaError } from "../utils/error.js";
import { resolveFileUrl } from "../utils/url.js";
import type { IProfileService } from "./profile_service.interface.js";

export class ProfileService implements IProfileService {
    private profileRepo: IProfileRepository;

    constructor(profileRepo: IProfileRepository) {
        this.profileRepo = profileRepo;
    }

    async getProfile(userId: string, limit: number, req: GetProfileReq): Promise<ProfileRes> {
        try {
            const user = await this.profileRepo.getUserById(userId);
            if (!user) {
                throw new Error("User tidak ditemukan");
            }

            const reportsData = req.role.toLowerCase() === "ob"
                ? await this.profileRepo.getReportsByObId(userId, limit, req.cursor, req.search, req.status)
                : await this.profileRepo.getReportsByUserId(userId, limit, req.cursor, req.search, req.status);

            const laporanMapped: MappedProfileReport[] = reportsData.items.map((item: ProfileReport) => {

                return {
                    id: item.id,
                    kategori: item.kategori?.nama_kategori || "",
                    deskripsi_kendala: item.deskripsi_kendala || "",
                    status: item.status,
                    prioritas: item.prioritas,
                    foto_masalah: (item.foto_masalah ?? []).map((f: string) => resolveFileUrl(f)).filter((url): url is string => url !== null),
                    lokasi: item.lantai?.lokasi?.nama_lokasi || "",
                    nomor_lantai: item.lantai?.nomor_lantai || 0,
                    nama_ob: item.ob?.nama_lengkap || null,
                    created_at: item.created_at instanceof Date ? item.created_at.toISOString() : String(item.created_at),
                    updated_at: item.updated_at instanceof Date ? item.updated_at.toISOString() : String(item.updated_at)
                };
            });

            return {
                user: {
                    id: user.id,
                    nama_lengkap: user.nama_lengkap,
                    username: user.username,
                    email: user.email,
                    role: user.role.nama_role,
                    profile_picture: resolveFileUrl(user.profile_picture)
                },
                laporan: {
                    items: laporanMapped,
                    next_cursor: reportsData.next_cursor ?? null,
                    meta: reportsData.meta ?? {
                        total_items: 0,
                        current_page: 1,
                        limit,
                        total_pages: 0
                    }
                }
            };
        } catch (err) {
            handlePrismaError(err);
        }
    }
    async getReportDetail(reportId: string): Promise<MappedReportDetailRes> {
    try {
        const item = await this.profileRepo.getReportDetailById(reportId);
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