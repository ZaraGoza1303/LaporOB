import { Prisma, type PrismaClient } from "../generated/prisma/client.js";
import type { Checklist_harianUncheckedCreateInput, Checklist_harianUncheckedUpdateInput } from "../generated/prisma/models.js";
import { CHECKLIST_STATUS } from "../utils/constants.js";
import { AppError } from "../utils/error.js";
import type { IChecklistHarianRepository, ChecklistHarianWithRelations, ChecklistHarianWithDetails, ChecklistHarianApprovalItem } from "./checklistHarian_repository.interface.js";
import { calculateCalendarDayRange, toCalendarDayExclusiveRange, type PeriodRange } from "../utils/date.js";
import type { PaginatedResponse } from "../types/response.js";

export class ChecklistHarianRepository implements IChecklistHarianRepository {
    private db: PrismaClient;

    constructor(db: PrismaClient) {
        this.db = db
    }

    async getTodayChecklists(obId: string, tanggal: Date): Promise<ChecklistHarianWithDetails[]> {
        const { start: startOfDay, end: endOfDay } = calculateCalendarDayRange(0, tanggal);

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
                tanggal: { gte: startOfDay, lt: endOfDay }
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
                tanggal: { gte: startOfDay, lt: endOfDay }
            },
            include: { kategori: true, lantai: { include: { lokasi: true } } },
            orderBy: { created_at: 'asc' },
            take: 2 - ownChecklists.length
        });

        const merged = [...ownChecklists, ...backupChecklists];
        return merged;
    }

    async countTodayChecklists(obId: string, tanggal: Date): Promise<number> {
        const { start: startOfDay, end: endOfDay } = calculateCalendarDayRange(0, tanggal);

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
                tanggal: { gte: startOfDay, lt: endOfDay }
            }
        });
        return count;
    }

    // Claim atomik: cek dan tulis dalam satu statement supaya dua OB yang
    // berebut slot yang sama tidak bisa sama-sama berhasil (pemenang = penulis pertama).
    async ambilChecklist(checklistId: string, obId: string): Promise<void> {
        const result = await this.db.checklist_harian.updateMany({
            where: { id: checklistId, ob_id: null },
            data: { ob_id: obId },
        });
        if (result.count > 0) return;

        const existing = await this.db.checklist_harian.findUnique({
            where: { id: checklistId },
            select: { ob_id: true },
        });
        if (!existing) {
            throw new AppError("Checklist tidak ditemukan", 404);
        }
        throw new AppError("Checklist sudah diambil oleh OB lain", 409);
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

    // kolom tanggal bertipe date dan tersimpan sebagai tengah malam UTC,
    // period WIB diterjemahkan ke hari kalender supaya filter harian tetap ada hasilnya saat subuh
    async getPendingApproval(period: PeriodRange, lokasiId?: string): Promise<ChecklistHarianApprovalItem[]> {
        const { start: startDay, end: endDay } = toCalendarDayExclusiveRange(period.start, period.end);

        const where: Prisma.Checklist_harianWhereInput = {
            status: CHECKLIST_STATUS.SELESAI,
            is_approved: false,
            tanggal: { gte: startDay, lt: endDay },
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

    async approve(checklistId: string): Promise<void> {
        const now = new Date();
        const existing = await this.db.checklist_harian.findUnique({
            where: { id: checklistId },
            select: { selesai_at: true },
        });

        await this.db.checklist_harian.update({
            where: { id: checklistId },
            data: {
                status: CHECKLIST_STATUS.SELESAI,
                is_approved: true,
                approved_at: now,
                selesai_at: existing?.selesai_at ?? now,
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
                include: {
                    kategori: true,
                    lantai: { include: { lokasi: true } },
                    ob: { omit: { password: true } },
                },
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
                lantai: { include: { lokasi: true } },
                ob: { omit: { password: true } },
            },
        });

        return items;
    }

    async getByID(checklist_harianId: string): Promise<ChecklistHarianWithRelations | null> {
        const data = await this.db.checklist_harian.findFirst({
            where: {
                id: checklist_harianId
            },
            include: {
                kategori: true,
                lantai: { include: { lokasi: true } },
                ob: { omit: { password: true } },
            },
        });

        return data;
    }

    async insertMany(data: Checklist_harianUncheckedCreateInput[]): Promise<number> {
        if (data.length === 0) return 0;

        const result = await this.db.checklist_harian.createMany({
            data,
            skipDuplicates: true,
        });

        return result.count;
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
