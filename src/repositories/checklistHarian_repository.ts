import type { ChecklistHarianQuery } from "../dto/checklist_harian.js";
import type { PaginatedResponse } from "../dto/response.js";
import type { Checklist_harian, PrismaClient } from "../generated/prisma/client.js";
import type { Checklist_harianUncheckedCreateInput, Checklist_harianUncheckedUpdateInput } from "../generated/prisma/models.js";
import type { IChecklistHarianRepository } from "./checklistHarian_repository.interface.js";

export class ChecklistHarianRepository implements IChecklistHarianRepository {
    private db: PrismaClient;

    constructor(db: PrismaClient) {
        this.db = db
    }

    async getAll(page: number, limit: number, query: ChecklistHarianQuery): Promise<PaginatedResponse<Checklist_harian>> {
        const { search, lokasi_id, lantai_id, status } = query;
        const offset = (page - 1) * limit;

        const where: any = {
            AND: [
                search
                    ? { tugas: { nama_tugas: { contains: search, mode: 'insensitive' } } }
                    : {},
                lantai_id ? { lantai_id } : {},
                status ? { status } : {},
                lokasi_id ? { lantai: { lokasi_id } } : {},
            ],
        };

        const [items, total] = await Promise.all([
            this.db.checklist_harian.findMany({
                where,
                skip: offset,
                take: limit,
                orderBy: { created_at: 'desc' },
                include: {
                    tugas: true,
                    kategori: true,
                    lantai: true,
                    ob: true,
                },
            }),
            this.db.checklist_harian.count({ where }),
        ]);

        const response: PaginatedResponse<Checklist_harian> = {
            items,
            next_cursor: null,
            meta: {
                total_items: total,
                current_page: page,
                limit,
                total_pages: Math.ceil(total / limit),
            },
        }

        return response
    }

    async getByID(checklist_harianId: string): Promise<Checklist_harian | null> {
        const data = await this.db.checklist_harian.findFirst({
            where: {
                id: checklist_harianId
            }
        })

        return data
    }

    async insert(req: Checklist_harianUncheckedCreateInput): Promise<void> {
        await this.db.checklist_harian.create({
            data: req,
        });
    }

    async update(checklist_harianId: string, req: Checklist_harianUncheckedUpdateInput): Promise<void> {
        await this.db.checklist_harian.update({
            where: {
                id: checklist_harianId,
            },
            data: req
        })
    }

    async delete(checklist_harianId: string): Promise<void> {
        await this.db.checklist_harian.delete({
            where: {
                id: checklist_harianId
            }
        })
    }
}