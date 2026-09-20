import type { CreateLantaiReq, UpdateLantaiReq } from "../dto/lantai.js";
import type { Lantai } from "../generated/prisma/client.js";
import type { LantaiCreateInput, LantaiUpdateInput } from "../generated/prisma/models.js";
import type { ILantaiRepository } from "../repositories/lantai_repository.interface.js";
import { handlePrismaError } from "../utils/error.js";
import type { ILantaiService } from "./lantai_service.interface.js";
import type { IRedisClient } from "../database/redis.interface.js"

export class LantaiService implements ILantaiService {
    private lantaiRepo: ILantaiRepository;
    private redis: IRedisClient;

    constructor(lantaiRepo: ILantaiRepository, redis: IRedisClient) {
        this.lantaiRepo = lantaiRepo
        this.redis = redis;
    }

    async getAll(lokasiId?: string): Promise<Lantai[]> {
        try {
            const cacheKey = `lantai:all:${lokasiId ?? "all"}`

            const cachedData = await this.redis.get(cacheKey)
            if (cachedData) {
                const parsedData = JSON.parse(cachedData);
                return parsedData
            }

            const data = await this.lantaiRepo.getAll(lokasiId);

            await this.redis.setEx(cacheKey, 300, JSON.stringify(data))
            return data;
        } catch (err) {
            handlePrismaError(err)
        }
    }

    async getById(lokasiId: string | undefined, lantaiId: string): Promise<Lantai | null> {
        try {
            const data = await this.lantaiRepo.getById(lokasiId, lantaiId);
            return data;
        } catch (err) {
            handlePrismaError(err)
        }
    }

    async create(req: CreateLantaiReq): Promise<{ id: string }> {
        try {
            const lantaiReq: LantaiCreateInput = {
                lokasi: {
                    connect: { id: req.lokasi_id }
                },

                nomor_lantai: req.nomor_lantai
            }

            const id = await this.lantaiRepo.insert(lantaiReq);
            return { id };
        } catch (err) {
            handlePrismaError(err)
        }
    }

    async update(lokasiId: string | undefined, lantaiId: string, req: UpdateLantaiReq): Promise<void> {
        try {
            const lantaiReq: LantaiUpdateInput = {}
            if (req.nomor_lantai !== undefined) lantaiReq.nomor_lantai = req.nomor_lantai

            await this.lantaiRepo.update(lokasiId, lantaiId, lantaiReq)

            if (lokasiId) await this.redis.del(`lantai:all:${lokasiId}`);
            await this.redis.del("lantai:all:all");
        } catch (err) {
            handlePrismaError(err)
        }
    }

    async delete(lokasiId: string | undefined, lantaiId: string): Promise<void> {
        try {
            await this.lantaiRepo.delete(lokasiId, lantaiId);

            if (lokasiId) await this.redis.del(`lantai:all:${lokasiId}`);
            await this.redis.del("lantai:all:all");
        } catch (err) {
            handlePrismaError(err)
        }
    }

}