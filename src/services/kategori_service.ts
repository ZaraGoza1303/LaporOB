import type { CreateCategoryReq, UpdateCategoryReq } from "../dto/kategori.js";
import type { IKategoriRepository } from "../repositories/kategori_repository.interface.js";
import type { Kategori } from "../generated/prisma/client.js";
import type { PaginatedResponse } from "../dto/response.js";

export class KategoriService {
    constructor(private kategoriRepo: IKategoriRepository) {}

    async getAllKategori(page: number, limit: number, search?: string | null): Promise<PaginatedResponse<Kategori>> {
        return this.kategoriRepo.getAll(page, limit, search);
    }
        
    async getKategoriById(id: string | number): Promise<Kategori | null> {
        return this.kategoriRepo.getById(id);
    }

    async createKategori(req: CreateCategoryReq): Promise<Kategori> {
        const newCategory = await this.kategoriRepo.create(req);
        return newCategory;
    }

    async updateKategori(id: string | number, req: UpdateCategoryReq): Promise<Kategori | null> {
        const isCategoryExist = await this.kategoriRepo.getById(id);
        if (!isCategoryExist) {
            throw new Error("Kategori tidak ditemukan, gagal update!");
        }

        return await this.kategoriRepo.update(id, req);
    }
}