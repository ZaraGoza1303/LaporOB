import type { Tugas, PrismaClient } from "../generated/prisma/client.js";
import type { TugasCreateInput, TugasUpdateInput } from "../generated/prisma/models.js";
import type { ITugasRepository } from "./tugas_repository.interface.js";

export class TugasRepository implements ITugasRepository {
    private db: PrismaClient;

    constructor(db: PrismaClient) {
        this.db = db;
    }

    async getAll(kategoriId: string): Promise<Tugas[]> {
        const data = await this.db.tugas.findMany({
            where: {
                kategori_id: kategoriId,
                is_active: true,
            },
            orderBy: {
                nama_tugas: 'asc',
            },
        });
        return data;
    }

    async getByID(tugasId: string): Promise<Tugas | null> {
        const tugas = await this.db.tugas.findFirst({
            where: {
                id: tugasId
            }
        })

        return tugas;
    }

    async insert(req: TugasCreateInput): Promise<void> {
        await this.db.tugas.create({
            data: req
        })
    }

    async update(tugasId: string, req: TugasUpdateInput): Promise<void> {
        await this.db.tugas.update({
            where: {
                id: tugasId
            },
            data: req
        })
    }

    async delete(tugasId: string): Promise<void> {
        await this.db.tugas.delete({
            where: {
                id: tugasId
            }
        })
    }
}
