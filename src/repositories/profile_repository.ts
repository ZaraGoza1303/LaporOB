import z from "zod";
import type { PrismaClient, Prisma } from "../generated/prisma/client.js";
import type { IProfileRepository, ProfileReport, ProfileUser } from "./profile_repository.interface.js";
import type { PaginatedResponse } from "../dto/response.js";

export class ProfileRepository implements IProfileRepository {
    private db: PrismaClient;

    constructor(db: PrismaClient) {
        this.db = db;
    }

    async getUserById(userId: string): Promise<ProfileUser | null> {
        return this.db.user.findFirst({
            where: {
                id: userId,
                is_deleted: false
            },
            include: {
                role: true
            }
        });
    }

    async getReportsByUserId(userId: string, limit: number, cursor?: string | null, search?: string | null, status?: string | null): Promise<PaginatedResponse<ProfileReport>> {
        const whereCondition = this.buildWhereClause({ pelapor_id: userId }, search, status);
        return this.executePaginatedReports(whereCondition, limit, cursor);
    }

    async getReportsByObId(obId: string, limit: number, cursor?: string | null, search?: string | null, status?: string | null): Promise<PaginatedResponse<ProfileReport>> {
        const whereCondition = this.buildWhereClause({ ob_id: obId }, search, status);
        return this.executePaginatedReports(whereCondition, limit, cursor);
    }


    private async executePaginatedReports(whereCondition: Prisma.Laporan_karyawanWhereInput, limit: number, cursor?: string | null): Promise<PaginatedResponse<ProfileReport>> {
        const [reports, total] = await Promise.all([
            this.db.laporan_karyawan.findMany({
                where: whereCondition,
                take: limit + 1,
                ...((cursor) && {
                    skip: 1,
                    cursor: { id: cursor }
                }),
                include: {
                    kategori: true,
                    lantai: { include: { lokasi: true } },
                    ob: true
                },
                orderBy: [
                    { created_at: "desc" },
                    { id: "desc" }
                ]
            }),
            this.db.laporan_karyawan.count({ where: whereCondition })
        ]);

        const hasNextPage = reports.length > limit;
        const items = hasNextPage ? reports.slice(0, limit) : reports;
        const nextCursor = hasNextPage ? (items[items.length - 1]?.id ?? null) : null;

        return {
            items: items as unknown as ProfileReport[],
            next_cursor: nextCursor,
            meta: {
                total_items: total,
                current_page: 1,
                limit,
                total_pages: Math.ceil(total / limit)
            }
        };
    }

    private buildWhereClause(baseFilter: Prisma.Laporan_karyawanWhereInput, search?: string | null, status?: string | null): Prisma.Laporan_karyawanWhereInput {
        const where: Prisma.Laporan_karyawanWhereInput = { ...baseFilter };

        if (search) {
            const isUuid = z.string().uuid().safeParse(search).success;
            where.OR = [
                ...(isUuid ? [{ id: search }] : []),
                { deskripsi_kendala: { contains: search, mode: "insensitive" as const } },
                { kategori: { nama_kategori: { contains: search, mode: "insensitive" as const } } },
                { lantai: { lokasi: { nama_lokasi: { contains: search, mode: "insensitive" as const } } } }
            ];
        }

        if (status) {
            where.status = { equals: status, mode: "insensitive" as const };
        }

        return where;
    }
}