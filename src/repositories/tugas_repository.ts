import type { PrismaClient } from "../generated/prisma/client.js";
import type { Tugas } from "../generated/prisma/client.js";
import type { TugasCreateInput, TugasUpdateInput } from "../generated/prisma/models.js";
import type { ITugasRepository, TugasApprovalItem, TugasDetailPayload } from "./tugas_repository.interface.js";
import type { PeriodRange } from "../utils/date.js";
import { Prisma } from "../generated/prisma/client.js";
import { TUGAS_STATUS, HARI } from "../utils/constants.js";
import type { PaginatedResponse } from "../types/response.js";

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

    async getAllPaginated(page: number, limit: number, search?: string): Promise<PaginatedResponse<TugasDetailPayload>> {
        const skip = (page - 1) * limit;

        const where: Prisma.TugasWhereInput = {
            is_active: true,
        };
        if (search) {
            where.nama_tugas = { contains: search, mode: 'insensitive' };
        }

        const [items, total_items] = await Promise.all([
            this.db.tugas.findMany({
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
            this.db.tugas.count({ where }),
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

    async getByID(tugasId: string): Promise<Tugas | null> {
        const tugas = await this.db.tugas.findFirst({
            where: {
                id: tugasId
            }
        })

        return tugas;
    }

    async getDetailByID(tugasId: string): Promise<TugasDetailPayload | null> {
        const tugas = await this.db.tugas.findFirst({
            where: { id: tugasId },
            include: {
                kategori: true,
                lantai: { include: { lokasi: true } },
                ob: { omit: { password: true } },
            },
        });
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

    async getAllTugasForOb(obId: string): Promise<Tugas[]> {
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

        return tugas;
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

    async getMatchingToday(today: Date): Promise<Tugas[]> {
        const todayName = HARI[today.getDay()] ?? '';
        const todayDateNum = today.getDate();

        const tugasList = await this.db.tugas.findMany({
            where: {
                is_active: true,
                tanggal_selesai: { gte: today },
            },
        });

        return tugasList.filter(t => {
            const hasHari = t.hari.length > 0;
            const hasUlang = t.tanggal_ulang !== null;
            const hasSpesifik = t.tanggal_spesifik.length > 0;

            if (t.tanggal_mulai && t.tanggal_mulai > today) return false;

            if (!hasHari && !hasUlang && !hasSpesifik) return true;

            const hariOk = hasHari && t.hari.includes(todayName);
            const ulangOk = hasUlang && t.tanggal_ulang === todayDateNum;
            const spesifikOk = hasSpesifik && t.tanggal_spesifik.some(d =>
                d.getFullYear() === today.getFullYear() &&
                d.getMonth() === today.getMonth() &&
                d.getDate() === today.getDate()
            );

            return hariOk || ulangOk || spesifikOk;
        });
    }

    async getPendingApproval(period: PeriodRange, lokasiId?: string): Promise<TugasApprovalItem[]> {
        const where: Prisma.TugasWhereInput = {
            status: TUGAS_STATUS.SELESAI,
            is_approved: false,
            created_at: { gte: period.start, lte: period.end },
        };

        if (lokasiId) {
            where.lantai = { lokasi_id: lokasiId };
        }

        const items = await this.db.tugas.findMany({
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

    async approve(tugasId: string, adminId: string): Promise<void> {
        const now = new Date();
        await this.db.tugas.update({
            where: { id: tugasId },
            data: {
                is_approved: true,
                approved_at: now,
            },
        });
    }
}
