import { Prisma, type PrismaClient } from "../generated/prisma/client.js";
import type { JadwalChecklist } from "../generated/prisma/client.js";
import type { Checklist_harianUncheckedCreateInput, Checklist_harianUncheckedUpdateInput } from "../generated/prisma/models.js";
import { CHECKLIST_STATUS } from "../utils/constants.js";
import type { IChecklistHarianRepository, ChecklistHarianWithRelations, ChecklistHarianWithDetails, ChecklistHarianApprovalItem } from "./checklistHarian_repository.interface.js";
import type { PeriodRange } from "../utils/date.js";
import type { PaginatedResponse } from "../types/response.js";

export class ChecklistHarianRepository implements IChecklistHarianRepository {
    private db: PrismaClient;

    constructor(db: PrismaClient) {
        this.db = db
    }

    async getTodayChecklists(obId: string, tanggal: Date): Promise<ChecklistHarianWithDetails[]> {
        const startOfDay = new Date(tanggal);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(tanggal);
        endOfDay.setHours(23, 59, 59, 999);

        const assignments = await this.db.penugasanOb.findMany({
            where: { ob_id: obId, bulan: tanggal.getMonth() + 1, tahun: tanggal.getFullYear() },
            select: { lokasi_id: true }
        });
        const lokasiIds = assignments.map(a => a.lokasi_id);

        const ownChecklists = await this.db.checklist_harian.findMany({
            where: {
                OR: [
                    { ob_id: obId },
                    { ob_id: null, lantai: { lokasi_id: { in: lokasiIds } } }
                ],
                tanggal: { gte: startOfDay, lte: endOfDay }
            },
            include: { kategori: true, lantai: { include: { lokasi: true } } },
            orderBy: { created_at: 'asc' },
            take: 2
        });

        if (ownChecklists.length >= 2) {
            return ownChecklists;
        }

        const backupChecklists = await this.db.checklist_harian.findMany({
            where: {
                ob_id: null,
                lantai: { lokasi_id: { notIn: lokasiIds } },
                tanggal: { gte: startOfDay, lte: endOfDay }
            },
            include: { kategori: true, lantai: { include: { lokasi: true } } },
            orderBy: { created_at: 'asc' },
            take: 2 - ownChecklists.length
        });

        const merged = [...ownChecklists, ...backupChecklists];
        return merged;
    }

    async countTodayChecklists(obId: string, tanggal: Date): Promise<number> {
        const startOfDay = new Date(tanggal);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(tanggal);
        endOfDay.setHours(23, 59, 59, 999);

        const assignments = await this.db.penugasanOb.findMany({
            where: { ob_id: obId, bulan: tanggal.getMonth() + 1, tahun: tanggal.getFullYear() },
            select: { lokasi_id: true }
        });
        const lokasiIds = assignments.map(a => a.lokasi_id);

        const count = await this.db.checklist_harian.count({
            where: {
                OR: [
                    { ob_id: obId },
                    { ob_id: null, lantai: { lokasi_id: { in: lokasiIds } } }
                ],
                tanggal: { gte: startOfDay, lte: endOfDay }
            }
        });
        return count;
    }

    async ambilChecklist(checklistId: string, obId: string): Promise<void> {
        await this.db.checklist_harian.update({
            where: { id: checklistId },
            data: { ob_id: obId },
        });
    }

    async getCompletedChecklistByOb(): Promise<Array<{ ob_id: string; nama_tugas: string }>> {
        const rows = await this.db.checklist_harian.findMany({
            where: { status: CHECKLIST_STATUS.SELESAI, ob_id: { not: null } },
            select: { ob_id: true, nama_tugas: true },
        });
        return rows
            .filter((r): r is { ob_id: string; nama_tugas: string } => r.ob_id !== null)
            .map(r => ({ ob_id: r.ob_id, nama_tugas: r.nama_tugas }));
    }

    async getPendingApproval(period: PeriodRange, lokasiId?: string): Promise<ChecklistHarianApprovalItem[]> {
        const where: Prisma.Checklist_harianWhereInput = {
            status: CHECKLIST_STATUS.SELESAI,
            is_approved: false,
            tanggal: { gte: period.start, lte: period.end },
        };

        if (lokasiId) {
            where.lantai = { lokasi_id: lokasiId };
        }

        const items = await this.db.checklist_harian.findMany({
            where,
            include: {
                ob: { select: { id: true, nama_lengkap: true } },
                lantai: { include: { lokasi: { select: { nama_lokasi: true } } } },
                kategori: { select: { id: true, nama_kategori: true } },
            },
            orderBy: { selesai_at: 'desc' },
        });

        return items;
    }

    async approve(checklistId: string, adminId: string): Promise<void> {
        const now = new Date();
        await this.db.checklist_harian.update({
            where: { id: checklistId },
            data: {
                is_approved: true,
                approved_at: now,
            },
        });
    }

    async getAllPaginated(page: number, limit: number, search?: string): Promise<PaginatedResponse<ChecklistHarianWithRelations>> {
        const skip = (page - 1) * limit;

        const where: Prisma.Checklist_harianWhereInput = {};
        if (search) {
            where.nama_tugas = { contains: search, mode: 'insensitive' };
        }

        const [items, total_items] = await Promise.all([
            this.db.checklist_harian.findMany({
                where,
                skip,
                take: limit,
                orderBy: { created_at: 'desc' },
                include: { kategori: true, lantai: true, ob: { omit: { password: true } } },
            }),
            this.db.checklist_harian.count({ where }),
        ]);

        return {
            items,
            next_cursor: null,
            meta: {
                total_items,
                current_page: page,
                limit,
                total_pages: Math.ceil(total_items / limit),
            },
        };
    }

    async getAll(): Promise<ChecklistHarianWithRelations[]> {
        const items = await this.db.checklist_harian.findMany({
            orderBy: { created_at: 'desc' },
            include: {
                kategori: true,
                lantai: true,
                ob: { omit: { password: true } },
            },
        });

        return items
    }

    async getByID(checklist_harianId: string): Promise<ChecklistHarianWithRelations | null> {
        const data = await this.db.checklist_harian.findFirst({
            where: {
                id: checklist_harianId
            },
            include: {
                kategori: true,
                lantai: true,
                ob: { omit: { password: true } },
            },
        })

        return data
    }

    async insertMany(data: Checklist_harianUncheckedCreateInput[]): Promise<void> {
        if (data.length === 0) return;

        await this.db.checklist_harian.createMany({
            data,
        });
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

    async insertFromJadwal(jadwal: JadwalChecklist): Promise<void> {
        await this.db.checklist_harian.create({
            data: {
                tanggal: new Date(),
                nama_tugas: jadwal.nama_tugas,
                ob_id: jadwal.ob_id,
                lantai_id: jadwal.lantai_id,
                kategori_id: jadwal.kategori_id,
                status: CHECKLIST_STATUS.BELUM_DIKERJAKAN,
                catatan: null,
            },
        });
    }

    async getExistingInstanceKeys(today: Date): Promise<Array<{ nama_tugas: string; lantai_id: string; ob_id: string | null }>> {
        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);

        return this.db.checklist_harian.findMany({
            where: { tanggal: { gte: startOfDay, lte: endOfDay } },
            select: { nama_tugas: true, lantai_id: true, ob_id: true },
        });
    }
}
