import type { CreateLaporanKaryawanInput, UserHomeRes, MappedProfileReport, ProfileRes } from "../dto/users.js";
import { LAPORAN_STATUS } from "../utils/constants.js";
import type { Laporan_karyawanCreateInput } from "../generated/prisma/models.js";
import type { IUsersRepository } from "../repositories/users_repository.interface.js";
import type { ILaporanRepository, ProfileReport } from "../repositories/laporan_repository.interface.js";
import { handlePrismaError } from "../utils/error.js";
import { resolveFileUrl } from "../utils/url.js";
import type { IKaryawanService, RiwayatParams } from "./karyawan_service.interface.js";
import type { IKategoriService } from "./kategori_service.interface.js";
import type { PaginatedResponse } from "../dto/response.js";

export class KaryawanService implements IKaryawanService {
    private usersRepo: IUsersRepository;
    private laporanRepo: ILaporanRepository;
    private kategoriService: IKategoriService;

    constructor(usersRepo: IUsersRepository, laporanRepo: ILaporanRepository, kategoriService: IKategoriService) {
        this.usersRepo = usersRepo;
        this.laporanRepo = laporanRepo;
        this.kategoriService = kategoriService;
    }

    async getHomeStats(userId: string): Promise<UserHomeRes> {
        try {
            const karyawanUser = await this.usersRepo.getByID(userId);
            if (!karyawanUser) {
                throw new Error("Karyawan tidak ditemukan")
            }

            const activity = await this.laporanRepo.getActivity(userId);
            const activityMapped = activity.map((item) => {
                return {
                    id: item.id,
                    deskripsi_kendala: item.deskripsi_kendala,
                    status: item.status,
                    foto_masalah: item.foto_masalah,
                    lokasi: item.lantai?.lokasi?.nama_lokasi ?? "",
                    nomor_lantai: item.lantai?.nomor_lantai ?? 0,
                    created_at: item.created_at ? item.created_at.toISOString() : ""
                };
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
                kategori: {
                    connect: { id: req.kategori_id }
                },

                deskripsi_kendala: req.deskripsi_kendala,
                prioritas: req.prioritas,
                foto_masalah: req.foto_masalah,
                status: LAPORAN_STATUS.BELUM_DIKERJAKAN,
            };

            await this.laporanRepo.insertReport(laporanReq);
        } catch (err) {
            handlePrismaError(err);
        }
    }

    async getRiwayat(userId: string, limit: number, params: RiwayatParams): Promise<PaginatedResponse<MappedProfileReport>> {
        try {
            const reportsData = await this.laporanRepo.getReportsByUserId(userId, limit, params.cursor, params.search, params.status);

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
}
