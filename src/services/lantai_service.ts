import type { CreateLantaiReq, UpdateLantaiReq } from "../dto/lantai.js";
import type { Lantai } from "../generated/prisma/client.js";
import type { LantaiCreateInput, LantaiUpdateInput } from "../generated/prisma/models.js";
import type { ILantaiRepository } from "../repositories/lantai_repository.interface.js";
import { handlePrismaError } from "../utils/error.js";
import type { ILantaiService } from "./lantai_service.interface.js";

export class LantaiService implements ILantaiService {
    private lantaiRepo: ILantaiRepository;

    constructor(lantaiRepo: ILantaiRepository) {
        this.lantaiRepo = lantaiRepo
    }

    async getAll(lokasiId: string): Promise<Lantai[]> {
        try {
            const data = await this.lantaiRepo.getAll(lokasiId);
            return data;
        } catch (err) {
            handlePrismaError(err)
        }
    }

    async getById(lokasiId: string, lantaiId: string): Promise<Lantai | null> {
        try {
            const data = await this.lantaiRepo.getById(lokasiId, lantaiId);
            return data;
        } catch (err) {
            handlePrismaError(err)
        }        
    }

    async create(req: CreateLantaiReq): Promise<void> {
        try {
            const lantaiReq: LantaiCreateInput = {
                lokasi: {
                    connect: {id: req.lokasi_id}
                },

                nomor_lantai: req.nomor_lantai
            }

            await this.lantaiRepo.insert(lantaiReq)
        } catch (err) {
            handlePrismaError(err)
        }
    }

    async update(lokasiId: string, lantaiId: string, req: UpdateLantaiReq): Promise<void> {
        try {
            const lantaiReq: LantaiUpdateInput = {}
            if(req.nomor_lantai !== undefined) lantaiReq.nomor_lantai = req.nomor_lantai

            await this.lantaiRepo.update(lokasiId, lantaiId, lantaiReq)
        } catch (err) {
            handlePrismaError(err)
        }
    }
    
    async delete(lokasiId: string, lantaiId: string): Promise<void> {
        try {
            await this.lantaiRepo.delete(lokasiId, lantaiId);
        } catch (err) {
            handlePrismaError(err)
        }
    }

}