import type { CreateKategoriReq, UpdateKategoriReq } from "../dto/kategori.js";
import type { Kategori } from "../generated/prisma/client.js";

export interface IKategoriService {
    getAll(): Promise<Kategori[]>
    getByID(kategoriId: string): Promise<Kategori | null>
    create(req: CreateKategoriReq): Promise<void>;
    update(kategoriId: string, req: UpdateKategoriReq): Promise<void>;
    delete(kategoriId: string): Promise<void>;

    getKategoriLimit(limit: number): Promise<Kategori[]>;
}