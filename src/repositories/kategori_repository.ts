import type { Kategori, PrismaClient } from "../generated/prisma/client.js";
import type { KategoriCreateInput, KategoriUpdateInput } from "../generated/prisma/models.js";
import type { IKategoriRepository } from "./kategori_repository.interface.js";

export class KategoriRepository implements IKategoriRepository {
    private db: PrismaClient;

    constructor(db: PrismaClient) {
        this.db = db;
    }

    async getAll(): Promise<Kategori[]> {
        const data = await this.db.kategori.findMany();
        return data
    }

    async getByID(kategoriId: string): Promise<Kategori | null> {
        const kategori = await this.db.kategori.findFirst({
            where: {
                id: kategoriId
            }
        })
        
        return kategori;
    }

    async insert(req: KategoriCreateInput): Promise<string> {
        const created = await this.db.kategori.create({
            data: req,
            select: { id: true },
        });
        return created.id;
    }

    async update(kategoriId: string, req: KategoriUpdateInput): Promise<void> {
        await this.db.kategori.update({
            where: {
                id: kategoriId
            },
            data: req
        })
    }

    async delete(kategoriId: string): Promise<void> {
        await this.db.kategori.delete({
            where: {
                id: kategoriId
            }
        })
    }
    
    async getKategoriLimit(limit: number): Promise<Kategori[]> {
        const data = await this.db.kategori.findMany({
            take: limit
        });
        
        return data
    }
}