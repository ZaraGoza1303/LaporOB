import type { CreateKategoriReq, UpdateKategoriReq } from "../dto/kategori.js";
import type { Kategori } from "../generated/prisma/client.js";
import type { KategoriCreateInput, KategoriUpdateInput } from "../generated/prisma/models.js";
import type { IKategoriRepository } from "../repositories/kategori_repository.interface.js";
import { handlePrismaError } from "../utils/error.js";
import type { IKategoriService } from "./kategori_service.interface.js";
import type { IRedisClient } from "../database/redis.interface.js";

export class KategoriService implements IKategoriService {
    private kategoriRepo: IKategoriRepository;
    private redis: IRedisClient;

    constructor(kategoriRepo: IKategoriRepository, redis: IRedisClient) {
        this.kategoriRepo = kategoriRepo;
        this.redis = redis;
    }

    async getAll(): Promise<Kategori[]> {
        try {
            const cacheKey = "kategori:all"

            const cachedData = await this.redis.get(cacheKey)
            if (cachedData) {
                const parsedData = JSON.parse(cachedData)
                return parsedData
            }

            const data = await this.kategoriRepo.getAll();

            await this.redis.setEx(cacheKey, 300, JSON.stringify(data))
            return data;
        } catch (err) {
            handlePrismaError(err)
        }
    }

    async getByID(kategoriId: string): Promise<Kategori | null> {
        try {
            const kategori = await this.kategoriRepo.getByID(kategoriId);
            return kategori;
        } catch (err) {
            handlePrismaError(err)
        }
    }

    async create(req: CreateKategoriReq): Promise<void> {
        try {
            const kategoriReq: KategoriCreateInput = {
                nama_kategori: req.nama_kategori,
            }

            await this.kategoriRepo.insert(kategoriReq);
        } catch (err) {
            handlePrismaError(err)
        }
    }

    async update(kategoriId: string, req: UpdateKategoriReq): Promise<void> {
        try {
            const kategoriReq: KategoriUpdateInput = {
                nama_kategori: req.nama_kategori
            }

            await this.kategoriRepo.update(kategoriId, kategoriReq);
            await this.redis.del("kategori:all");
        } catch (err) {
            handlePrismaError(err) 
        }
    }

    async delete(kategoriId: string): Promise<void> {
        try {
            await this.kategoriRepo.delete(kategoriId);
            await this.redis.del("kategori:all");
        } catch (err) {
            handlePrismaError(err)
        }
    }

    async getKategoriLimit(limit: number): Promise<Kategori[]> {
        try {
            const data = await this.kategoriRepo.getKategoriLimit(limit);
            return data;
        } catch (err) {
            handlePrismaError(err)
        }
    }
}