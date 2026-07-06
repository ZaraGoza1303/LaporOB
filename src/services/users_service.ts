import type { PaginatedResponse } from "../dto/response.js";
import type { CreateLaporanKaryawanInput, CreateUserReq, CreateUserRes, UpdateUserReq, UserHomeRes, GetProfileReq, ProfileRes, MappedReportDetailRes, MappedProfileReport } from "../dto/users.js";
import { LAPORAN_STATUS } from "../utils/constants.js";
import type { User } from "../generated/prisma/client.js";
import type { Laporan_karyawanCreateInput, UserCreateInput, UserTokenCreateInput, UserUpdateInput } from "../generated/prisma/models.js";
import type { IUsersRepository, ProfileReport } from "../repositories/users_repository.interface.js";
import { handlePrismaError } from "../utils/error.js";
import { generateActivationToken } from "../utils/token.js";
import { buildActivationUrl, resolveFileUrl } from "../utils/url.js";
import type { IUsersService } from "./users_service.interface.js";
import { StorageServiceFactory } from "./storage_service.factory.js";
import bcrypt from 'bcrypt';
import type { IKategoriService } from "./kategori_service.interface.js";

export class UsersService implements IUsersService {
    private usersRepo: IUsersRepository;
    private kategoriService: IKategoriService;
    private storageService = StorageServiceFactory.getProvider();

    constructor(usersRepo: IUsersRepository, kategoriService: IKategoriService) {
        this.usersRepo = usersRepo;
        this.kategoriService = kategoriService;
    }

    async getAll(page: number, limit: number, search?: string | null): Promise<PaginatedResponse<User>> {
        try {
            const users = await this.usersRepo.getAll(page, limit, search);
            if (users && users.items) {
                users.items = users.items.map(user => {
                    if (user.profile_picture) {
                        user.profile_picture = resolveFileUrl(user.profile_picture);
                    }
                    return user;
                });
            }
            return users;
        } catch (err) {
            handlePrismaError(err)
        }
    }

    async getByID(userId: string): Promise<User | null> {
        try {
            const user = await this.usersRepo.getByID(userId);
            if (user && user.profile_picture) {
                user.profile_picture = resolveFileUrl(user.profile_picture);
            }
            return user;
        } catch (err) {
            handlePrismaError(err)
        }
    }

    async create(req: CreateUserReq): Promise<CreateUserRes> {
        try {
            const hashedPassword = await bcrypt.hash(req.password, 16);
            const activationToken = generateActivationToken(1);

            const userReq: UserCreateInput = {
                role: {
                    connect: { id: req.role_id }
                },
                username: req.username,
                email: req.email,
                password: hashedPassword,
                nama_lengkap: req.nama_lengkap,
            }

            const createdUser = await this.usersRepo.insert(userReq);

            const activationUserReq: UserTokenCreateInput = {
                user: {
                    connect: { id: createdUser.id }
                },
                token_hash: activationToken.tokenHash,
                type: "activation",
                expired_at: activationToken.expiredAt,
            }

            await this.usersRepo.insertActivationToken(activationUserReq);
            const activationUrl = buildActivationUrl(activationToken.token);

            const res: CreateUserRes = {
                activationUrl
            }

            return res;
        } catch (err) {
            handlePrismaError(err)
        }
    }

    async update(userId: string, req: UpdateUserReq, file?: Express.Multer.File): Promise<void> {
        try {
            const userReq: UserUpdateInput = {}

            if (file) {
                const oldUser = await this.usersRepo.getByID(userId);
                const oldPp = oldUser?.profile_picture || "";
                userReq.profile_picture = await this.storageService.updateFile(file, oldPp);
            }

            if (req.username !== undefined) userReq.username = req.username;
            if (req.nama_lengkap !== undefined) userReq.nama_lengkap = req.nama_lengkap;
            if (req.password !== undefined) userReq.password = await bcrypt.hash(req.password, 16);
            if (req.role_id !== undefined) {
                userReq.role = {
                    connect: { id: req.role_id }
                };
            }

            await this.usersRepo.update(userId, userReq);
        } catch (err) {
            handlePrismaError(err)
        }
    }

    async delete(userId: string): Promise<void> {
        try {
            await this.usersRepo.delete(userId);
        } catch (err) {
            handlePrismaError(err)
        }
    }
    
    async getHomeStats(userId: string): Promise<UserHomeRes> {
        try {
            const karyawanUser = await this.usersRepo.getByID(userId);
            if (!karyawanUser) {
                throw new Error("Karyawan tidak ditemukan")
            }

            const activity = await this.usersRepo.getActivity(userId);
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
                karyawan : {
                    nama_lengkap: karyawanUser?.nama_lengkap
                },
                kategori: kategori,
                acitivity : activityMapped
            }

            return response;
        } catch (err){
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

            await this.usersRepo.insertReport(laporanReq);
        } catch (err) {
            handlePrismaError(err);
        }
    }

    async getProfile(userId: string, limit: number, req: GetProfileReq): Promise<ProfileRes> {
        try {
            const user = await this.usersRepo.getUserWithRoleById(userId);
            if (!user) {
                throw new Error("User tidak ditemukan");
            }

            const reportsData = req.role.toLowerCase() === "ob"
                ? await this.usersRepo.getReportsByObId(userId, limit, req.cursor, req.search, req.status)
                : await this.usersRepo.getReportsByUserId(userId, limit, req.cursor, req.search, req.status);

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
            const item = await this.usersRepo.getReportDetailById(reportId);
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