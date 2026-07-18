import type { PrismaClient } from "../generated/prisma/client.js";
import type { Tugas } from "../generated/prisma/client.js";
import type { TugasCreateInput, TugasUpdateInput } from "../generated/prisma/models.js";
import type { ITugasRepository } from "./tugas_repository.interface.js";
import { Prisma } from "../generated/prisma/client.js";
import type { ObTugasItem } from "../dto/ob.js";
import { TUGAS_STATUS } from "../utils/constants.js";

export class TugasRepository implements ITugasRepository {
    private db: PrismaClient;

    constructor(db: PrismaClient) {
        this.db = db;
    }

    async getAll(kategoriId?: string): Promise<Tugas[]> {
        const where: Prisma.TugasWhereInput = {
            is_active: true,
        };

        if (kategoriId) {
            where.kategori_id = kategoriId;
        }

        const data = await this.db.tugas.findMany({
            where,
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

    async getAvailableForOb(obId: string): Promise<ObTugasItem[]> {
        const tugas = await this.db.tugas.findMany({
            where: {
                is_active: true,
                OR: [
                    { ob_id: null },
                    { ob_id: obId },
                ],
            },
            include: {
                kategori: true,
                lantai: {
                    include: {
                        lokasi: true,
                    },
                },
            },
            orderBy: {
                created_at: 'desc',
            },
        });

        const result: ObTugasItem[] = tugas.map((item) => ({
            id: item.id,
            nama_tugas: item.nama_tugas,
            kategori: item.kategori?.nama_kategori || "",
            lantai_id: item.lantai_id,
            lokasi: item.lantai?.lokasi?.nama_lokasi || "",
            nomor_lantai: item.lantai?.nomor_lantai || 0,
            status: item.status,
            catatan: item.catatan,
            created_at: item.created_at instanceof Date ? item.created_at.toISOString() : String(item.created_at),
        }));
        return result;
    }

    async claimByOb(tugasId: string, obId: string): Promise<void> {
        const now = new Date();
        await this.db.tugas.update({
            where: { id: tugasId },
            data: {
                ob_id: obId,
                status: TUGAS_STATUS.SEDANG_DIKERJAKAN,
                dikerjakan_at: now,
            },
        });
    }

    async completeByOb(tugasId: string, obId: string): Promise<void> {
        const now = new Date();
        await this.db.tugas.update({
            where: { id: tugasId, ob_id: obId },
            data: {
                status: TUGAS_STATUS.SELESAI,
                selesai_at: now,
            },
        });
    }
}
