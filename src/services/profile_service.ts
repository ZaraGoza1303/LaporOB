import type { ProfileRes, MappedProfileReport } from "../dto/profile.js";
import type { IProfileRepository, ProfileReport } from "../repositories/profile_repository.interface.js";
import { handlePrismaError } from "../utils/error.js";
import { resolveFileUrl } from "../utils/url.js";
import type { IProfileService } from "./profile_service.interface.js";

export class ProfileService implements IProfileService {
    private profileRepo: IProfileRepository;

    constructor(profileRepo: IProfileRepository) {
        this.profileRepo = profileRepo;
    }

    async getProfile(userId: string, limit: number, cursor?: string | null, search?: string | null, status?: string | null): Promise<ProfileRes> {
        try {
            const user = await this.profileRepo.getUserById(userId);
            if (!user) {
                throw new Error("User tidak ditemukan");
            }

            const reportsData = await this.profileRepo.getReportsByUserId(userId, limit, cursor, search, status);
            
            const laporanMapped: MappedProfileReport[] = reportsData.items.map((item: ProfileReport) => {
                const shortId = String(item.id).slice(0, 8).toUpperCase();

                return {
                    id: item.id,
                    kode_laporan: `#REP-${shortId}`,
                    kategori: item.kategori?.nama_kategori || "",
                    deskripsi_kendala: item.deskripsi_kendala || "",
                    status: item.status,
                    prioritas: item.prioritas,
                    foto_masalah: resolveFileUrl(item.foto_masalah),
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
}