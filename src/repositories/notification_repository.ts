import type { PaginatedResponse } from "../dto/response.js";
import type { Notifikasi, PrismaClient } from "../generated/prisma/client.js";
import type { NotifikasiCreateInput } from "../generated/prisma/models.js";
import type { INotificationRepository, NotifikasiWithPengirim } from "./notification_repository.interface.js";

export class NotificationRepository implements INotificationRepository {
    private db: PrismaClient

    constructor(db: PrismaClient) {
        this.db = db;
    }

    async insert(req: NotifikasiCreateInput): Promise<Notifikasi> {
        const data = await this.db.notifikasi.create({
            data: req
        })

        return data;
    }

    async insertMany(reqs: NotifikasiCreateInput[]): Promise<Notifikasi[]> {
        return this.db.$transaction(
            reqs.map(req => this.db.notifikasi.create({ data: req }))
        );
    }

    async markAsRead(notifId: string): Promise<void> {
        await this.db.notifikasi.update({
            where: { id: notifId },
            data: {
                is_read: true,
                read_at: new Date(),
            }
        });
    }

    async markAllAsRead(userId: string): Promise<void> {
        await this.db.notifikasi.updateMany({
            where: {
                penerima_id: userId,
                is_read: false,
            },
            data: {
                is_read: true,
                read_at: new Date(),
            }
        });
    }

    async countUnread(userId: string): Promise<number> {
        return this.db.notifikasi.count({
            where: {
                penerima_id: userId,
                is_read: false,
            }
        });
    }

    async getAllByUserId(userId: string, limit: number, cursor?: string | null): Promise<PaginatedResponse<NotifikasiWithPengirim>> {
        const where = { penerima_id: userId };

        const [raw, total_items] = await Promise.all([
            this.db.notifikasi.findMany({
                where,
                take: limit + 1,
                ...(cursor && { skip: 1, cursor: { id: cursor } }),
                include: {
                    pengirim: {
                        select: { id: true, nama_lengkap: true }
                    }
                },
                orderBy: [
                    { created_at: 'desc' },
                    { id: 'desc' }
                ]
            }),
            this.db.notifikasi.count({ where })
        ]);

        const hasNextPage = raw.length > limit;
        const items = hasNextPage ? raw.slice(0, limit) : raw;
        const nextCursor = hasNextPage ? items[items.length - 1]?.id ?? null : null;

        return {
            items,
            next_cursor: nextCursor,
            meta: {
                total_items,
                current_page: 1,
                limit,
                total_pages: 1
            }
        };
    }

    async getAllByDateRange(startDate: Date, endDate: Date): Promise<NotifikasiWithPengirim[]> {
        return this.db.notifikasi.findMany({
            where: {
                created_at: {
                    gte: startDate,
                    lt: endDate,
                }
            },
            include: {
                pengirim: {
                    select: { id: true, nama_lengkap: true }
                }
            },
            orderBy: [
                { created_at: 'desc' },
                { id: 'desc' }
            ]
        });
    }

    async getByTypesAndDateRange(types: string[], startDate: Date, endDate: Date): Promise<NotifikasiWithPengirim[]> {
        return this.db.notifikasi.findMany({
            where: {
                tipe: { in: types },
                created_at: {
                    gte: startDate,
                    lt: endDate,
                }
            },
            include: {
                pengirim: {
                    select: { id: true, nama_lengkap: true }
                }
            },
            orderBy: [
                { created_at: 'desc' },
                { id: 'desc' }
            ]
        });
    }

    async getByUserAndDateRange(userId: string, startDate: Date, endDate: Date): Promise<NotifikasiWithPengirim[]> {
        return this.db.notifikasi.findMany({
            where: {
                penerima_id: userId,
                created_at: {
                    gte: startDate,
                    lt: endDate,
                }
            },
            include: {
                pengirim: {
                    select: { id: true, nama_lengkap: true }
                }
            },
            orderBy: [
                { created_at: 'desc' },
                { id: 'desc' }
            ]
        });
    }

}
