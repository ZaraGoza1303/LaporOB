import type { CreateTugasReq, UpdateTugasReq, TugasDetailRes } from "../dto/tugas.js";
import type { Tugas } from "../generated/prisma/client.js";
import type { TugasCreateInput, TugasUpdateInput } from "../generated/prisma/models.js";
import type { ITugasRepository, TugasApprovalItem, TugasDetailPayload } from "../repositories/tugas_repository.interface.js";
import { handlePrismaError, AppError } from "../utils/error.js";
import type { ITugasService } from "./tugas_service.interface.js";
import type { IRedisClient } from "../database/redis.interface.js";
import type { ISkillService } from "./skill_service.interface.js";
import type { IAchievementService } from "./achievement_service.interface.js";
import { resolveFileUrl } from "../utils/url.js";

export class TugasService implements ITugasService {
    private tugasRepo: ITugasRepository;
    private redis: IRedisClient;
    private skillService: ISkillService;
    private achievementService: IAchievementService;

    constructor(tugasRepo: ITugasRepository, redis: IRedisClient, skillService: ISkillService, achievementService: IAchievementService) {
        this.tugasRepo = tugasRepo;
        this.redis = redis;
        this.skillService = skillService;
        this.achievementService = achievementService;
    }

    async getAll(kategoriId?: string): Promise<Tugas[]> {
        try {
            const cacheKey = `tugas:all:${kategoriId ?? "all"}`

            const cachedData = await this.redis.get(cacheKey)
            if (cachedData) {
                const parsedData = JSON.parse(cachedData)
                return parsedData
            }
            
            const data = await this.tugasRepo.getAll(kategoriId);
            await this.redis.setEx(cacheKey, 300, JSON.stringify(data))
            return data;
        } catch (err) {
            handlePrismaError(err)
        }
    }

    async getByID(tugasId: string): Promise<Tugas | null> {
        try {
            const tugas = await this.tugasRepo.getByID(tugasId);
            return tugas;
        } catch (err) {
            handlePrismaError(err)
        }
    }

    async getAllPaginated(page: number, limit: number, search?: string): Promise<import("../dto/response.js").PaginatedResponse<TugasDetailRes>> {
        try {
            const result = await this.tugasRepo.getAllPaginated(page, limit, search);
            const items: TugasDetailRes[] = result.items.map((tugas: TugasDetailPayload) => {
                let total_durasi: number | null = null;
                if (tugas.dikerjakan_at && tugas.selesai_at) {
                    total_durasi = Math.floor((tugas.selesai_at.getTime() - tugas.dikerjakan_at.getTime()) / 1000);
                }
                return {
                    id: tugas.id,
                    nama_tugas: tugas.nama_tugas,
                    kategori: tugas.kategori ?? null,
                    lantai: tugas.lantai ?? null,
                    ob: tugas.ob ?? null,
                    status: tugas.status,
                    catatan: tugas.catatan,
                    foto_awal: (tugas.foto_awal ?? []).map((f: string) => resolveFileUrl(f)).filter((url: string | null): url is string => url !== null),
                    foto_akhir: (tugas.foto_akhir ?? []).map((f: string) => resolveFileUrl(f)).filter((url: string | null): url is string => url !== null),
                    dikerjakan_at: tugas.dikerjakan_at,
                    selesai_at: tugas.selesai_at,
                    total_durasi,
                    hari: tugas.hari,
                    is_approved: tugas.is_approved,
                    approved_at: tugas.approved_at,
                    created_at: tugas.created_at,
                    updated_at: tugas.updated_at,
                };
            });
            return { items, next_cursor: result.next_cursor, meta: result.meta ?? { total_items: 0, current_page: page, limit, total_pages: 0 } };
        } catch (err) {
            handlePrismaError(err);
        }
    }

    async getDetailByID(tugasId: string): Promise<TugasDetailRes | null> {
        try {
            const tugas = await this.tugasRepo.getDetailByID(tugasId);
            if (!tugas) return null;

            let total_durasi: number | null = null;
            if (tugas.dikerjakan_at && tugas.selesai_at) {
                total_durasi = Math.floor((tugas.selesai_at.getTime() - tugas.dikerjakan_at.getTime()) / 1000);
            }

            return {
                id: tugas.id,
                nama_tugas: tugas.nama_tugas,
                kategori: tugas.kategori ?? null,
                lantai: tugas.lantai ?? null,
                ob: tugas.ob ?? null,
                status: tugas.status,
                catatan: tugas.catatan,
                foto_awal: (tugas.foto_awal ?? []).map((f: string) => resolveFileUrl(f)).filter((url: string | null): url is string => url !== null),
                foto_akhir: (tugas.foto_akhir ?? []).map((f: string) => resolveFileUrl(f)).filter((url: string | null): url is string => url !== null),
                dikerjakan_at: tugas.dikerjakan_at,
                selesai_at: tugas.selesai_at,
                total_durasi,
                hari: tugas.hari,
                is_approved: tugas.is_approved,
                approved_at: tugas.approved_at,
                created_at: tugas.created_at,
                updated_at: tugas.updated_at,
            };
        } catch (err) {
            handlePrismaError(err)
        }
    }

    async create(req: CreateTugasReq): Promise<void> {
        try {
            const tugasReq: TugasCreateInput = {
                kategori: {
                    connect: { id: req.kategori_id }
                },
                nama_tugas: req.nama_tugas,
                hari: req.hari ?? [],
                tanggal_ulang: req.tanggal_ulang ?? null,
                tanggal_spesifik: req.tanggal_spesifik ?? [],
                tanggal_mulai: req.tanggal_mulai ? new Date(req.tanggal_mulai) : null,
                tanggal_selesai: new Date(req.tanggal_selesai),
                is_active: req.is_active ?? true,
            };

            await this.tugasRepo.insert(tugasReq);
            await this.redis.del(`tugas:all:${req.kategori_id}`);
            await this.redis.del("tugas:all:all");
        } catch (err) {
            handlePrismaError(err)
        }
    }

    async update(tugasId: string, req: UpdateTugasReq): Promise<void> {
        try {
            const existing = await this.tugasRepo.getByID(tugasId);
            if (!existing) {
                throw new AppError("Tugas tidak ditemukan", 404);
            }

            const tugasReq: TugasUpdateInput = {}
            if (req.kategori_id !== undefined) tugasReq.kategori = { connect: { id: req.kategori_id } };
            if (req.nama_tugas !== undefined) tugasReq.nama_tugas = req.nama_tugas;
            if (req.hari !== undefined) tugasReq.hari = req.hari;
            if (req.tanggal_ulang !== undefined) tugasReq.tanggal_ulang = req.tanggal_ulang;
            if (req.tanggal_spesifik !== undefined) tugasReq.tanggal_spesifik = req.tanggal_spesifik;
            if (req.tanggal_mulai !== undefined) tugasReq.tanggal_mulai = req.tanggal_mulai ? new Date(req.tanggal_mulai) : null;
            if (req.tanggal_selesai !== undefined) tugasReq.tanggal_selesai = new Date(req.tanggal_selesai);
            if (req.is_active !== undefined) tugasReq.is_active = req.is_active;

            await this.tugasRepo.update(tugasId, tugasReq);
            if (req.kategori_id) await this.redis.del(`tugas:all:${req.kategori_id}`);
            await this.redis.del("tugas:all:all");

        } catch (err) {
            if (err instanceof AppError) throw err;
            handlePrismaError(err)
        }
    }

    async delete(tugasId: string): Promise<void> {
        try {
            await this.tugasRepo.delete(tugasId);
            await this.redis.del("tugas:all:all");
        } catch (err) {
            handlePrismaError(err)
        }
    }

    async getAllTugasForOb(obId: string): Promise<Tugas[]> {
        try {
            const tugas = await this.tugasRepo.getAllTugasForOb(obId);
            return tugas;
        } catch (err) {
            throw handlePrismaError(err);
        }
    }

    async claimTugas(tugasId: string, obId: string, fotoAwal: string[]): Promise<void> {
        try {
            const tugas = await this.tugasRepo.getByID(tugasId);
            if (!tugas) {
                throw new AppError("Tugas tidak ditemukan", 404);
            }
            if (tugas.ob_id !== null) {
                throw new AppError("Tugas sudah diambil oleh OB lain", 409);
            }
            await this.tugasRepo.claimByOb(tugasId, obId, fotoAwal);
        } catch (err) {
            if (err instanceof AppError) throw err;
            throw handlePrismaError(err);
        }
    }

    async completeTugas(tugasId: string, obId: string, fotoAkhir: string[], catatan?: string): Promise<void> {
        try {
            const tugas = await this.tugasRepo.getByID(tugasId);
            if (!tugas) {
                throw new AppError("Tugas tidak ditemukan", 404);
            }
            if (tugas.ob_id !== obId) {
                throw new AppError("Bukan tugas anda", 403);
            }
            await this.tugasRepo.completeByOb(tugasId, obId, fotoAkhir, catatan);
            await this.skillService.prosesSkillOtomatisForOb(obId);
            await this.achievementService.prosesOtomatisUntukOb(obId);
        } catch (err) {
            throw handlePrismaError(err);
        }
    }

    async getCompletedTugasForOb(obId: string, limit: number, cursor?: string | null, search?: string | null): Promise<import("../dto/response.js").PaginatedResponse<TugasDetailRes>> {
        try {
            const result = await this.tugasRepo.getCompletedTugasByObId(obId, limit, cursor, search);
            const items: TugasDetailRes[] = result.items.map((tugas: TugasDetailPayload) => {
                let total_durasi: number | null = null;
                if (tugas.dikerjakan_at && tugas.selesai_at) {
                    total_durasi = Math.floor((tugas.selesai_at.getTime() - tugas.dikerjakan_at.getTime()) / 1000);
                }
                return {
                    id: tugas.id,
                    nama_tugas: tugas.nama_tugas,
                    kategori: tugas.kategori ?? null,
                    lantai: tugas.lantai ?? null,
                    ob: tugas.ob ?? null,
                    status: tugas.status,
                    catatan: tugas.catatan,
                    foto_awal: (tugas.foto_awal ?? []).map((f: string) => resolveFileUrl(f)).filter((url: string | null): url is string => url !== null),
                    foto_akhir: (tugas.foto_akhir ?? []).map((f: string) => resolveFileUrl(f)).filter((url: string | null): url is string => url !== null),
                    dikerjakan_at: tugas.dikerjakan_at,
                    selesai_at: tugas.selesai_at,
                    total_durasi,
                    hari: tugas.hari,
                    is_approved: tugas.is_approved,
                    approved_at: tugas.approved_at,
                    created_at: tugas.created_at,
                    updated_at: tugas.updated_at,
                };
            });
            return {
                items,
                next_cursor: result.next_cursor,
                meta: result.meta ?? {
                    total_items: 0,
                    current_page: 1,
                    limit,
                    total_pages: 0
                }
            };
        } catch (err) {
            throw handlePrismaError(err);
        }
    }

    async countCompletedTugasForOb(obId: string): Promise<number> {
        try {
            return await this.tugasRepo.countCompletedTugasByObId(obId);
        } catch (err) {
            throw handlePrismaError(err);
        }
    }

    async getScheduledTugas(obId: string, today: Date): Promise<Tugas[]> {
        try {
            const tugas = await this.tugasRepo.getMatchingToday(today);
            return tugas.filter(t => t.ob_id === null || t.ob_id === obId);
        } catch (err) {
            throw handlePrismaError(err);
        }
    }

    async getPendingApprovalTugas(period: { start: Date; end: Date }, lokasiId?: string): Promise<TugasApprovalItem[]> {
        try {
            const items = await this.tugasRepo.getPendingApproval(period, lokasiId);
            return items;
        } catch (err) {
            throw handlePrismaError(err);
        }
    }

    async approveTugas(tugasId: string, adminId: string): Promise<void> {
        try {
            await this.tugasRepo.approve(tugasId, adminId);
        } catch (err) {
            throw handlePrismaError(err);
        }
    }
}
