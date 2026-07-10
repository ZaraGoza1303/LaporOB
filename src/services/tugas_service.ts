import type { CreateTugasReq, UpdateTugasReq } from "../dto/tugas.js";
import type { Tugas } from "../generated/prisma/client.js";
import type { TugasCreateInput, TugasUpdateInput } from "../generated/prisma/models.js";
import type { ITugasRepository } from "../repositories/tugas_repository.interface.js";
import { handlePrismaError } from "../utils/error.js";
import type { ITugasService } from "./tugas_service.interface.js";

export class TugasService implements ITugasService {
    private tugasRepo: ITugasRepository;

    constructor(tugasRepo: ITugasRepository) {
        this.tugasRepo = tugasRepo;
    }

    async getAll(kategoriId?: string): Promise<Tugas[]> {
        try {
            const data = await this.tugasRepo.getAll(kategoriId);
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
                is_active: req.is_active ?? true,
            }

            await this.tugasRepo.insert(tugasReq);
        } catch (err) {
            handlePrismaError(err)
        }
    }

    async update(tugasId: string, req: UpdateTugasReq): Promise<void> {
        try {
            const tugasReq: TugasUpdateInput = {}
            if (req.kategori_id !== undefined) tugasReq.kategori = { connect: { id: req.kategori_id } };
            if (req.nama_tugas !== undefined) tugasReq.nama_tugas = req.nama_tugas;
            if (req.is_active !== undefined) tugasReq.is_active = req.is_active;

            await this.tugasRepo.update(tugasId, tugasReq);
        } catch (err) {
            handlePrismaError(err)
        }
    }

    async delete(tugasId: string): Promise<void> {
        try {
            await this.tugasRepo.delete(tugasId);
        } catch (err) {
            handlePrismaError(err)
        }
    }
}
