import type { Ruangan, PrismaClient } from "../generated/prisma/client.js";
import type { RuanganCreateInput, RuanganUpdateInput } from "../generated/prisma/models.js";
import type { IRuanganRepository } from "./ruangan_repository.interface.js";

export class RuanganRepository implements IRuanganRepository {
    private db: PrismaClient;

    constructor(db: PrismaClient) {
        this.db = db
    }

    async getAll(lantaiId: string): Promise<Ruangan[]> {
        const data = await this.db.ruangan.findMany({
            where: {
                lantai_id: lantaiId
            }
        });

        return data;
    }

    async getById(lantaiId: string, ruanganId: string): Promise<Ruangan | null> {
        const data = await this.db.ruangan.findUnique({
            where: {
                id: ruanganId,
                lantai_id: lantaiId
            }
        })

        return data;
    }

    async insert(req: RuanganCreateInput): Promise<void> {
        await this.db.ruangan.create({
            data: req
        })
    }

    async update(lantaiId: string, ruanganId: string, req: RuanganUpdateInput): Promise<void> {
        await this.db.ruangan.update({
            where: {
                id: ruanganId,
                lantai_id: lantaiId,
            },
            data: req
        })
    }

    async delete(lantaiId: string, ruanganId: string): Promise<void> {
        await this.db.ruangan.delete({
            where: {
                id: ruanganId,
                lantai_id: lantaiId
            }
        })
    }

}
