import type { PaginatedResponse } from "../dto/response.js";
import type { UserActivityRes } from "../dto/users.js";
import type { PrismaClient } from "../generated/prisma/client.js";
import type { Laporan_karyawanCreateInput } from "../generated/prisma/models.js";
import type { ILaporanRepository, ProfileReport, DetailReportPayload } from "./laporan_repository.interface.js";
import { Prisma } from "../generated/prisma/client.js";

export class LaporanRepository implements ILaporanRepository {
    private db: PrismaClient;

    constructor(db: PrismaClient) {
        this.db = db;
    }

    async getActivity(userId: string): Promise<UserActivityRes[]> {
        const data = await this.db.laporan_karyawan.findMany({
            where: {
                pelapor_id: userId
            },
            include: {
                lantai: {
                    include: {
                        lokasi: true
                    }
                },
                kategori: true
            },
            orderBy: {
                created_at: 'desc'
            },
            take: 2
        });

        return data as unknown as UserActivityRes[];
    }

    async insertReport(req: Laporan_karyawanCreateInput): Promise<void> {
        await this.db.laporan_karyawan.create({
            data: req
        })
    }

    async getReportsByUserId(userId: string, limit: number, cursor?: string | null, search?: string | null, status?: string | null): Promise<PaginatedResponse<ProfileReport>> {
        const whereCondition = this.buildWhereClause({ pelapor_id: userId }, search, status);
        return this.executePaginatedReports(whereCondition, limit, cursor);
    }

    async getReportsByObId(obId: string, limit: number, cursor?: string | null, search?: string | null, status?: string | null): Promise<PaginatedResponse<ProfileReport>> {
        const whereCondition = this.buildWhereClause({ ob_id: obId }, search, status);
        return this.executePaginatedReports(whereCondition, limit, cursor);
    }

    async getReportDetailById(reportId: string): Promise<DetailReportPayload | null> {
        return this.db.laporan_karyawan.findUnique({
            where: {
                id: reportId
            },
            include: {
                kategori: true,
                lantai: {
                    include: {
                        lokasi: true
                    }
                },
                ob: true,
                pelapor: true
            }
        }) as Promise<DetailReportPayload | null>;
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
            where.OR = [
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
