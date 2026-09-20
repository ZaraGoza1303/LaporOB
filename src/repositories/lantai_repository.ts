import type { Lantai, PrismaClient } from "../generated/prisma/client.js";
import type { LantaiCreateInput, LantaiUpdateInput } from "../generated/prisma/models.js";
import type { ILantaiRepository } from "./lantai_repository.interface.js";

export class LantaiRepository implements ILantaiRepository {
    private db: PrismaClient;

    constructor(db: PrismaClient) {
        this.db = db
    }

    async getAll(lokasiId?: string): Promise<Lantai[]> {
        const data = await this.db.lantai.findMany({
            where: lokasiId ? {
                lokasi_id: lokasiId
            } : {}
        });

        return data;
    }

    async getById(lokasiId: string | undefined, lantaiId: string): Promise<Lantai | null> {
        const data = await this.db.lantai.findFirst({
            where: lokasiId ? {
                id: lantaiId,
                lokasi_id: lokasiId
            } : {
                id: lantaiId
            }
        })

        return data;
    }

    async insert(req: LantaiCreateInput): Promise<string> {
        const created = await this.db.lantai.create({
            data: req,
            select: { id: true },
        });
        return created.id;
    }

    async update(lokasiId: string | undefined, lantaiId: string, req: LantaiUpdateInput): Promise<void> {
        await this.db.lantai.update({
            where: {
                id: lantaiId
            },
            data: req
        })
    }

    async delete(lokasiId: string | undefined, lantaiId: string): Promise<void> {
        await this.db.lantai.delete({
            where: {
                id: lantaiId
            }
        })
    }

}