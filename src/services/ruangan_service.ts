import type { CreateRuanganReq, UpdateRuanganReq } from "../dto/ruangan.js";
import type { Ruangan } from "../generated/prisma/client.js";
import type { RuanganCreateInput, RuanganUpdateInput } from "../generated/prisma/models.js";
import type { IRuanganRepository } from "../repositories/ruangan_repository.interface.js";
import { handlePrismaError } from "../utils/error.js";
import type { IRuanganService } from "./ruangan_service.interface.js";

export class RuanganService implements IRuanganService {
    private ruanganRepo: IRuanganRepository;

    constructor(ruanganRepo: IRuanganRepository) {
        this.ruanganRepo = ruanganRepo
    }

    async getAll(lantaiId?: string): Promise<Ruangan[]> {
        try {
            const data = await this.ruanganRepo.getAll(lantaiId);
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
        } catch (err) {
            handlePrismaError(err)
        }
    }

    async update(lantaiId: string | undefined, ruanganId: string, req: UpdateRuanganReq): Promise<void> {
        try {
            const ruanganReq: RuanganUpdateInput = {}
            if (req.nama !== undefined) ruanganReq.nama = req.nama

            await this.ruanganRepo.update(lantaiId, ruanganId, ruanganReq)
        } catch (err) {
            handlePrismaError(err)
        }
    }

    async delete(lantaiId: string | undefined, ruanganId: string): Promise<void> {
        try {
            await this.ruanganRepo.delete(lantaiId, ruanganId);
        } catch (err) {
            handlePrismaError(err)
        }
    }

}
