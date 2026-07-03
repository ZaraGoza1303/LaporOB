import type { CreateKategoriReq, UpdateKategoriReq } from "../dto/kategori.js";
import type { Kategori } from "../generated/prisma/client.js";
import type { KategoriCreateInput, KategoriUpdateInput } from "../generated/prisma/models.js";
import type { IKategoriRepository } from "../repositories/kategori_repository.interface.js";
import { handlePrismaError } from "../utils/error.js";
import type { IKategoriService } from "./kategori_service.interface.js";

export class KategoriService implements IKategoriService {
    private kategoriRepo: IKategoriRepository;

    constructor(kategoriRepo: IKategoriRepository) {
        this.kategoriRepo = kategoriRepo;
    }

    async getAll(): Promise<Kategori[]> {
        try {
            const data = await this.kategoriRepo.getAll();
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
        } catch (err) {
            handlePrismaError(err) 
        }
    }

    async delete(kategoriId: string): Promise<void> {
        try {
            await this.kategoriRepo.delete(kategoriId);
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