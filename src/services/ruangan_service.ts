import type { CreateRuanganReq, UpdateRuanganReq } from "../dto/ruangan.js";
import type { Ruangan } from "../generated/prisma/client.js";
import type { RuanganCreateInput, RuanganUpdateInput } from "../generated/prisma/models.js";
import type { IRuanganRepository } from "../repositories/ruangan_repository.interface.js";
import { handlePrismaError } from "../utils/error.js";
import type { IRuanganService } from "./ruangan_service.interface.js";
import type { IRedisClient } from "../database/redis.interface.js";

export class RuanganService implements IRuanganService {
    private ruanganRepo: IRuanganRepository;
    private redis: IRedisClient;
    constructor(ruanganRepo: IRuanganRepository, redis: IRedisClient) {
        this.ruanganRepo = ruanganRepo
        this.redis = redis
    }

    async getAll(lantaiId?: string): Promise<Ruangan[]> {
        try {
            const cacheKey = `ruangan:all:${lantaiId ?? "all"}`

            const cachedData = await this.redis.get(cacheKey)
            if (cachedData) {
                const parsedData = JSON.parse(cachedData)
                return parsedData
            }

            const data = await this.ruanganRepo.getAll(lantaiId);
            await this.redis.setEx(cacheKey, 300, JSON.stringify(data))
            return data;
        } catch (err) {
            handlePrismaError(err)
        }
    }

    async getById(lantaiId: string | undefined, ruanganId: string): Promise<Ruangan | null> {
        try {
            const data = await this.ruanganRepo.getById(lantaiId, ruanganId);
            return data;
        } catch (err) {
            handlePrismaError(err)
        }
    }

    async create(req: CreateRuanganReq): Promise<void> {
        try {
            const ruanganReq: RuanganCreateInput = {
                lantai: {
                    connect: { id: req.lantai_id }
                },
                nama: req.nama
            }

            await this.ruanganRepo.insert(ruanganReq)
            await this.redis.del(`ruangan:all:${req.lantai_id}`);
            await this.redis.del("ruangan:all:all");

        } catch (err) {
            handlePrismaError(err)
        }
    }

    async update(lantaiId: string | undefined, ruanganId: string, req: UpdateRuanganReq): Promise<void> {
        try {
            const ruanganReq: RuanganUpdateInput = {}
            if (req.nama !== undefined) ruanganReq.nama = req.nama

            await this.ruanganRepo.update(lantaiId, ruanganId, ruanganReq)
            if (lantaiId) await this.redis.del(`ruangan:all:${lantaiId}`);
            await this.redis.del("ruangan:all:all");
        } catch (err) {
            handlePrismaError(err)
        }
    }

    async delete(lantaiId: string | undefined, ruanganId: string): Promise<void> {
        try {
            await this.ruanganRepo.delete(lantaiId, ruanganId);
            if (lantaiId) await this.redis.del(`ruangan:all:${lantaiId}`);
            await this.redis.del("ruangan:all:all");
        } catch (err) {
            handlePrismaError(err)
        }
    }

}
