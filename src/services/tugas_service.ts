import type { CreateTugasReq, UpdateTugasReq } from "../dto/tugas.js";
import type { Tugas } from "../generated/prisma/client.js";
import type { TugasCreateInput, TugasUpdateInput } from "../generated/prisma/models.js";
import type { ITugasRepository } from "../repositories/tugas_repository.interface.js";
import { handlePrismaError, AppError } from "../utils/error.js";
import type { ITugasService } from "./tugas_service.interface.js";
import type { IRedisClient } from "../database/redis.interface.js";

export class TugasService implements ITugasService {
    private tugasRepo: ITugasRepository;
    private redis: IRedisClient;

    constructor(tugasRepo: ITugasRepository, redis: IRedisClient) {
        this.tugasRepo = tugasRepo;
        this.redis = redis;
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

    async create(req: CreateTugasReq): Promise<void> {
        try {
            const tugasReq: TugasCreateInput = {
                kategori: {
                    connect: { id: req.kategori_id }
                },
                nama_tugas: req.nama_tugas,
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

    async claimTugas(tugasId: string, obId: string): Promise<void> {
        try {
            await this.tugasRepo.claimByOb(tugasId, obId);
        } catch (err) {
            throw handlePrismaError(err);
        }
    }

    async completeTugas(tugasId: string, obId: string): Promise<void> {
        try {
            await this.tugasRepo.completeByOb(tugasId, obId);
        } catch (err) {
            throw handlePrismaError(err);
        }
    }
}
