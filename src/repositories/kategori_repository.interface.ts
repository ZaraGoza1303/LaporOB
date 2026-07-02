import type { CreateCategoryReq, UpdateCategoryReq } from "../dto/kategori.js";
import type { Kategori } from "../generated/prisma/client.js";
import type { PaginatedResponse } from "../dto/response.js";

export interface IKategoriRepository {
    getAll(page: number, limit: number, search?: string | null): Promise<PaginatedResponse<Kategori>>;
    getById(id: string | number): Promise<Kategori | null>;
    create(data: CreateCategoryReq): Promise<Kategori>;
    update(id: string | number, data: UpdateCategoryReq): Promise<Kategori | null>;
}