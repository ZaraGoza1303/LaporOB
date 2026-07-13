import type { ChecklistHarianQuery } from "../dto/checklist_harian.js";
import type { PaginatedResponse } from "../dto/response.js";
import { Prisma, type PrismaClient } from "../generated/prisma/client.js";
import type { Checklist_harianUncheckedCreateInput, Checklist_harianUncheckedUpdateInput } from "../generated/prisma/models.js";
import { CHECKLIST_STATUS } from "../utils/constants.js";
import { calculatePeriodRange, type PeriodRange } from "../utils/date.js";
import type { IChecklistHarianRepository, ChecklistHarianWithRelations } from "./checklistHarian_repository.interface.js";

export class ChecklistHarianRepository implements IChecklistHarianRepository {
    private db: PrismaClient;

    constructor(db: PrismaClient) {
        this.db = db
    }

    async countTotalChecklist(dateRange?: PeriodRange): Promise<number> {
        const data = await this.db.checklist_harian.count({
            where: dateRange ? { tanggal: { gte: dateRange.start, lte: dateRange.end } } : {}
        });
        return data;
    }
    
    async countTotalChecklistDone(dateRange?: PeriodRange): Promise<number> {
        const data = await this.db.checklist_harian.count({
            where: {
                status: CHECKLIST_STATUS.SELESAI,
                ...(dateRange ? { tanggal: { gte: dateRange.start, lte: dateRange.end } } : {})
            }
        });

        return data;
    }
    
    async countTotalChecklistPending(dateRange?: PeriodRange): Promise<number> {
        const data = await this.db.checklist_harian.count({
            where: {
                status: CHECKLIST_STATUS.SEDANG_DIKERJAKAN,
                ...(dateRange ? { tanggal: { gte: dateRange.start, lte: dateRange.end } } : {})
            }
        });
        
        return data;
    }

    async countTotalChecklistLate(dateRange?: PeriodRange): Promise<number> {
        const data = await this.db.checklist_harian.count({
            where: {
                status: CHECKLIST_STATUS.TERLEWAT,
                ...(dateRange ? { tanggal: { gte: dateRange.start, lte: dateRange.end } } : {})
            }
        });
        
        return data;
    }

    async getAll(page: number, limit: number, query: ChecklistHarianQuery): Promise<PaginatedResponse<ChecklistHarianWithRelations>> {
        const { search, lokasi_id, lantai_id, status, period } = query;
        const offset = (page - 1) * limit;

        const where: Prisma.Checklist_harianWhereInput = {};

      
        if (period) {
            const range = calculatePeriodRange(period);
            where.tanggal = { gte: range.start, lte: range.end };
        }

        if (search) {
            where.tugas = { nama_tugas: { contains: search, mode: 'insensitive' } };
        }
        if (lantai_id) {
            where.lantai_id = lantai_id;
        }
        if (status) {
            where.status = { equals: status, mode: 'insensitive' };
        }
        if (lokasi_id) {
            where.lantai = { lokasi_id };
        }

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

        const response: PaginatedResponse<ChecklistHarianWithRelations> = {
            items: items as any,
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

    async getByID(checklist_harianId: string): Promise<ChecklistHarianWithRelations | null> {
        const data = await this.db.checklist_harian.findFirst({
            where: {
                id: checklist_harianId
            },
            include: {
                tugas: true,
                kategori: true,
                lantai: true,
                ob: true,
            },
        })

        return data as any
    }

    async insert(req: Checklist_harianUncheckedCreateInput): Promise<void> {
        await this.db.checklist_harian.create({
            data: req,
        });
    }

    async update(checklist_harianId: string, req: Checklist_harianUncheckedUpdateInput): Promise<void> {
        await this.db.checklist_harian.update({
            where: {
                id: checklist_harianId
            },
            data: req,
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
