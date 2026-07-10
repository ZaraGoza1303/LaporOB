import type { Ruangan, PrismaClient } from "../generated/prisma/client.js";
import type { RuanganCreateInput, RuanganUpdateInput } from "../generated/prisma/models.js";
import type { IRuanganRepository } from "./ruangan_repository.interface.js";

export class RuanganRepository implements IRuanganRepository {
    private db: PrismaClient;

    constructor(db: PrismaClient) {
        this.db = db
    }

    async getAll(lantaiId?: string): Promise<Ruangan[]> {
        const data = await this.db.ruangan.findMany({
            where: lantaiId ? {
                lantai_id: lantaiId
            } : {}
        });

        return data;
    }

    async getById(lantaiId: string | undefined, ruanganId: string): Promise<Ruangan | null> {
        const data = await this.db.ruangan.findFirst({
            where: lantaiId ? {
                id: ruanganId,
                lantai_id: lantaiId
            } : {
                id: ruanganId
            }
        })

        return data;
    }

    async insert(req: RuanganCreateInput): Promise<void> {
        await this.db.ruangan.create({
            data: req
        })
    }

    async update(lantaiId: string | undefined, ruanganId: string, req: RuanganUpdateInput): Promise<void> {
        await this.db.ruangan.update({
            where: {
                id: ruanganId,
            },
            data: req
        })
    }

    async delete(lantaiId: string | undefined, ruanganId: string): Promise<void> {
        await this.db.ruangan.delete({
            where: {
                id: ruanganId,
            }
        })
    }

}
