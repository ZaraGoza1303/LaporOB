import type { PaginatedResponse } from "../dto/response.js";
import type { UserActivityRes } from "../dto/users.js";
import type { AdminLaporanQuery } from "../dto/admin.js";
import type { PrismaClient } from "../generated/prisma/client.js";
import type { Laporan_karyawanCreateInput } from "../generated/prisma/models.js";
import type { ILaporanRepository, ProfileReport, DetailReportPayload, RecentActivityPayload, ReportSummaryPayload, AdminLaporanPayload, RuanganTerpopulerPayload } from "./laporan_repository.interface.js";
import { Prisma } from "../generated/prisma/client.js";
import { LAPORAN_STATUS } from "../utils/constants.js";

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

    async insertReport(req: Laporan_karyawanCreateInput): Promise<string> {
        const result = await this.db.laporan_karyawan.create({
            data: req,
            select: { id: true }
        })
        return result.id;
    }

    async patchLaporan(laporanId: string, data: Prisma.Laporan_karyawanUncheckedUpdateInput): Promise<void> {
        await this.db.laporan_karyawan.update({
            where: { id: laporanId },
            data,
        });
    }

    async updateKolaborasiOpen(laporanId: string, isOpen: boolean): Promise<void> {
        await this.db.laporan_karyawan.update({
            where: { id: laporanId },
            data: { is_kolaborasi_open: isOpen },
        });
    }

    async getReportsByUserId(userId: string, limit: number, cursor?: string | null, search?: string | null, status?: string | null): Promise<PaginatedResponse<ProfileReport>> {
        const whereCondition = this.buildWhereClause({ pelapor_id: userId }, search, status);
        return this.executePaginatedReports(whereCondition, limit, cursor);
    }

    async getReportsByObId(obId: string, limit: number, cursor?: string | null, search?: string | null, status?: string | null): Promise<PaginatedResponse<ProfileReport>> {
        const whereCondition = this.buildWhereClause({
            OR: [
                { ob_id: obId },
                { kolaborasi: { some: { ob_id: obId, status: "APPROVED" } } }
            ]
        }, search, status);
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
                pelapor: true,
                histori_pekerjaan: true
            }
        }) as Promise<DetailReportPayload | null>;
    }

    async getRecentActivities(limit: number): Promise<RecentActivityPayload[]> {
        return this.db.laporan_karyawan.findMany({
            include: {
                lantai: {
                    include: { lokasi: true }
                },
                ob: true
            },
            orderBy: {
                updated_at: 'desc'
            },
            take: limit
        }) as Promise<RecentActivityPayload[]>;
    }

    async getReportsByDateRange(startDate: Date, endDate: Date): Promise<ReportSummaryPayload[]> {
        return this.db.laporan_karyawan.findMany({
            where: {
                created_at: {
                    gte: startDate,
                    lte: endDate
                }
            },
            select: {
                id: true,
                status: true,
                created_at: true
            }
        }) as Promise<ReportSummaryPayload[]>;
    }

    async getAllLaporan(page: number, limit: number, query: AdminLaporanQuery): Promise<PaginatedResponse<AdminLaporanPayload>> {
        const offset = (page - 1) * limit;
        const where = this.buildAdminLaporanWhereClause(query);
        const orderBy = this.buildAdminLaporanOrderBy(query);

        const [laporan, total_laporan] = await Promise.all([
            this.db.laporan_karyawan.findMany({
                where,
                skip: offset,
                take: limit,
                include: {
                    pelapor: true,
                    ob: true,
                    lantai: {
                        include: {
                            lokasi: true
                        }
                    },
                    kategori: true
                },
                orderBy
            }),
            this.db.laporan_karyawan.count({ where })
        ]);

        return {
            items: laporan as unknown as AdminLaporanPayload[],
            next_cursor: null,
            meta: {
                total_items: total_laporan,
                current_page: page,
                limit,
                total_pages: Math.ceil(total_laporan / limit)
            }
        }
    }

    async getRuanganTerpopuler(limit: number, query: AdminLaporanQuery): Promise<any[]> {
        const where = this.buildAdminLaporanWhereClause(query);

        const laporan = await this.db.laporan_karyawan.findMany({
            where,
            include: {
                ruangan: {
                    include: {
                        lantai: {
                            include: {
                                lokasi: true
                            }
                        }
                    }
                }
            }
        });

        return laporan;
    }

    async countLaporanAktif(query: AdminLaporanQuery): Promise<number> {
        const where = this.buildAdminLaporanWhereClause(query);
        where.status = {
            in: [LAPORAN_STATUS.BELUM_DIKERJAKAN, LAPORAN_STATUS.PENDING]
        };

        return this.db.laporan_karyawan.count({ where });
    }

    async getLaporanCountByUserId(userId: string): Promise<number> {
        return this.db.laporan_karyawan.count({
            where: {
                pelapor_id: userId
            }
        });
    }

    async deleteLaporan(laporanId: string): Promise<void> {
        await this.db.laporan_karyawan.delete({
            where: { id: laporanId }
        });
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
        const filters: Prisma.Laporan_karyawanWhereInput[] = [baseFilter];

        if (search) {
            filters.push({
                OR: [
                    { deskripsi_kendala: { contains: search, mode: "insensitive" as const } },
                    { lantai: { lokasi: { nama_lokasi: { contains: search, mode: "insensitive" as const } } } }
                ]
            });
        }

        if (status) {
            filters.push({ status: { equals: status, mode: "insensitive" as const } });
        }

        return filters.length === 1 ? filters[0]! : { AND: filters };
    }

    private buildAdminLaporanWhereClause(query: AdminLaporanQuery): Prisma.Laporan_karyawanWhereInput {
        const where: Prisma.Laporan_karyawanWhereInput = {};

        if (query.search) {
            where.OR = [
                { deskripsi_kendala: { contains: query.search, mode: "insensitive" } },
                { pelapor: { nama_lengkap: { contains: query.search, mode: "insensitive" } } },
                { kategori: { nama_kategori: { contains: query.search, mode: "insensitive" } } },
                { lantai: { lokasi: { nama_lokasi: { contains: query.search, mode: "insensitive" } } } }
            ];
        }

        if (query.status) {
            where.status = { equals: query.status, mode: "insensitive" };
        }

        if (query.prioritas) {
            where.prioritas = { equals: query.prioritas, mode: "insensitive" };
        }

        if (query.lantai_id) {
            where.lantai_id = query.lantai_id;
        }

        if (query.lokasi_id) {
            where.lantai = {
                lokasi_id: query.lokasi_id
            };
        }

        if (query.start_date || query.end_date) {
            where.created_at = {};

            if (query.start_date) {
                where.created_at.gte = query.start_date;
            }

            if (query.end_date) {
                const endDate = new Date(query.end_date);
                endDate.setHours(23, 59, 59, 999);
                where.created_at.lte = endDate;
            }
        }

        return where;
    }

    private buildAdminLaporanOrderBy(query: AdminLaporanQuery): Prisma.Laporan_karyawanOrderByWithRelationInput[] {
        const sortOrder = query.sort_order;

        if (query.sort_by === "nama_karyawan") {
            return [
                { pelapor: { nama_lengkap: sortOrder } },
                { created_at: "desc" }
            ];
        }

        if (query.sort_by === "lokasi") {
            return [
                { lantai: { lokasi: { nama_lokasi: sortOrder } } },
                { created_at: "desc" }
            ];
        }

        return [
            { [query.sort_by]: sortOrder } as Prisma.Laporan_karyawanOrderByWithRelationInput,
            { created_at: "desc" }
        ];
    }
}
