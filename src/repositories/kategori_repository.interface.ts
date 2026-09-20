import type { Kategori } from "../generated/prisma/client.js";
import type { KategoriCreateInput, KategoriUpdateInput } from "../generated/prisma/models.js";

export interface IKategoriRepository {
    getAll(): Promise<Kategori[]>
    getByID(kategoriId: string): Promise<Kategori | null>
    insert(req: KategoriCreateInput): Promise<string>;
    update(kategoriId: string, req: KategoriUpdateInput): Promise<void>;
    delete(kategoriId: string): Promise<void>;
    
    getKategoriLimit(limit: number): Promise<Kategori[]>
}