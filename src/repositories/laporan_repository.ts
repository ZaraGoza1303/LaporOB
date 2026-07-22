import type { PaginatedResponse } from "../dto/response.js";
import type { UserActivityRes } from "../dto/users.js";
import type { AdminLaporanHistoryQuery, AdminLaporanQuery } from "../dto/admin.js";
import type { PrismaClient, Prisma, Laporan_karyawan } from "../generated/prisma/client.js";
import type { PeriodRange } from "../utils/date.js";
import type { Laporan_karyawanCreateInput } from "../generated/prisma/models.js";
import type { ILaporanRepository, ProfileReport, DetailReportPayload, RecentActivityPayload, ReportSummaryPayload, AdminLaporanPayload, RuanganTerpopulerPayload, LaporanKaryawanWithDetails } from "./laporan_repository.interface.js";
import { LAPORAN_STATUS, KOLABORASI_STATUS } from "../utils/constants.js";

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

        return data;
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

    async updateKolaborasiOpen(laporanId: string, isOpen: boolean, catatan?: string): Promise<void> {
        await this.db.laporan_karyawan.update({
            where: { id: laporanId },
            data: { 
                is_kolaborasi_open: isOpen,
                catatan_kolaborasi: isOpen ? (catatan || null) : null
            },
        });
    }

    async getReportsByUserId(userId: string, limit: number, cursor?: string | null, search?: string | null, status?: string | null): Promise<PaginatedResponse<ProfileReport>> {
        const whereCondition = this.buildWhereClause({ pelapor_id: userId }, search, status);
        const reports = await this.executePaginatedReports(whereCondition, limit, cursor);
        return reports;
    }

    async getReportsByObId(obId: string, limit: number, cursor?: string | null, search?: string | null, status?: string | null): Promise<PaginatedResponse<ProfileReport>> {
        const whereCondition = this.buildWhereClause({
            OR: [
                { ob_id: obId },
                { kolaborasi: { some: { ob_id: obId, status: KOLABORASI_STATUS.APPROVED } } }
            ]
        }, search, status);
        const reports = await this.executePaginatedReports(whereCondition, limit, cursor);
        return reports;
    }

    async getReportDetailById(reportId: string): Promise<DetailReportPayload | null> {
        const report = await this.db.laporan_karyawan.findUnique({
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
                histori_pekerjaan: true,
                kolaborasi: {
                    include: {
                        ob: {
                            select: { id: true, nama_lengkap: true }
                        }
                    }
                }
            }
        });

        return report;
    }

    async getRecentActivities(page: number, limit: number): Promise<PaginatedResponse<RecentActivityPayload>> {
        const offset = (page - 1) * limit;

        const where = {
            prioritas: "URGENT",
            status: { in: ["BELUM_DIKERJAKAN", "PENDING"] }
        };

        const [activities, total] = await Promise.all([
            this.db.laporan_karyawan.findMany({
                where,
                include: {
                    lantai: {
                        include: { lokasi: true }
                    },
                    ob: true
                },
                orderBy: {
                    created_at: 'desc'
                },
                skip: offset,
                take: limit
            }),
            this.db.laporan_karyawan.count({ where })
        ]);

        return {
            items: activities,
            next_cursor: null,
            meta: {
                total_items: total,
                current_page: page,
                limit,
                total_pages: Math.ceil(total / limit)
            }
        };
    }

    async getReportsByDateRange(startDate: Date, endDate: Date): Promise<ReportSummaryPayload[]> {
        const reports = await this.db.laporan_karyawan.findMany({
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
        });

        return reports;
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

        const result: PaginatedResponse<AdminLaporanPayload> = {
            items: laporan,
            next_cursor: null,
            meta: {
                total_items: total_laporan,
                current_page: page,
                limit,
                total_pages: Math.ceil(total_laporan / limit)
            }
        };
        return result
    }

    async getAllHistoryLaporan(page: number, limit: number, query: AdminLaporanHistoryQuery): Promise<PaginatedResponse<Laporan_karyawan>> {
        const offset = (page - 1) * limit;
        const where = this.buildHistorySearchWhere(query);

        const [laporan, total_laporan] = await Promise.all([
            this.db.laporan_karyawan.findMany({
                where,
                skip: offset,
                take: limit,
                include: {
                    lantai: {
                        include: {
                            lokasi: true
                        }
                    },
                    kategori: true
                },
                orderBy: { created_at: "desc" }
            }),
            this.db.laporan_karyawan.count({ where })
        ]);

        const result: PaginatedResponse<Laporan_karyawan> = {
            items: laporan,
            next_cursor: null,
            meta: {
                total_items: total_laporan,
                current_page: page,
                limit,
                total_pages: Math.ceil(total_laporan / limit)
            }
        };
        return result
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

        const count = await this.db.laporan_karyawan.count({ where });
        return count;
    }

    async getLaporanCountByUserId(userId: string): Promise<number> {
        const count = await this.db.laporan_karyawan.count({
            where: {
                pelapor_id: userId
            }
        });
        return count;
    }

    async deleteLaporan(laporanId: string): Promise<void> {
        await this.db.laporan_karyawan.delete({
            where: { id: laporanId }
        });
    }

    async getReportsForObDashboard(obId: string): Promise<LaporanKaryawanWithDetails[]> {
        const reports = await this.db.laporan_karyawan.findMany({
            where: {
                status: { in: [LAPORAN_STATUS.BELUM_DIKERJAKAN, LAPORAN_STATUS.PENDING] },
                prioritas: "URGENT",
            },
            include: { kategori: true, lantai: { include: { lokasi: true } } },
            orderBy: { created_at: 'desc' },
        });

        return reports;
    }

    async ambilLaporan(laporanId: string, obId: string): Promise<void> {
        const now = new Date();
        await this.db.laporan_karyawan.update({
            where: { id: laporanId },
            data: { status: "PENDING", ob_id: obId, dikerjakan_at: now }
        });
    }

    async createHistoriSelesai(laporanId: string, obId: string, fotoSelesai: string[], catatan: string): Promise<void> {
        const now = new Date();
        await this.db.$transaction([
            this.db.histori_pekerjaan.create({
                data: {
                    laporan: { connect: { id: laporanId } },
                    ob: { connect: { id: obId } },
                    foto_selesai: { set: fotoSelesai },
                    catatan: catatan,
                }
            }),
            this.db.laporan_karyawan.update({
                where: { id: laporanId },
                data: { status: "SELESAI", selesai_at: now }
            })
        ]);
    }

    async batalkanLaporan(laporanId: string, obId: string, fotoSelesai: string[], catatan: string): Promise<void> {
        const now = new Date();
        await this.db.$transaction([
            this.db.histori_pekerjaan.create({
                data: {
                    laporan: { connect: { id: laporanId } },
                    ob: { connect: { id: obId } },
                    foto_selesai: { set: fotoSelesai },
                    catatan: catatan,
                }
            }),
            this.db.laporan_karyawan.update({
                where: { id: laporanId },
                data: {
                    status: "BELUM_DIKERJAKAN",
                    ob_id: null,
                    alasan_gagal: catatan,
                    dibatalkan_at: now,
                }
            })
        ]);
    }

    async approveLaporan(laporanId: string, catatan?: string): Promise<Laporan_karyawan> {
        const laporan = await this.db.laporan_karyawan.update({
            where: { id: laporanId },
            data: {
                is_approved: true,
                admin_catatan: catatan ?? null,
            }
        });
        return laporan;
    }

    async rejectLaporan(laporanId: string, catatan: string): Promise<Laporan_karyawan> {
        const now = new Date();
        const laporan = await this.db.laporan_karyawan.update({
            where: { id: laporanId },
            data: {
                status: LAPORAN_STATUS.DIBATALKAN,
                ob_id: null,
                is_approved: false,
                admin_catatan: catatan,
                dibatalkan_at: now,
            }
        });
        return laporan;
    }

    async getObPerformanceStats(obId: string, dateRange?: PeriodRange): Promise<{ laporanDiterima: number; laporanSelesai: number }> {
        const dateFilter = dateRange
            ? { created_at: { gte: dateRange.start, lte: dateRange.end } }
            : {};

        const [laporanDiterima, laporanSelesai] = await Promise.all([
            this.db.laporan_karyawan.count({ where: { ob_id: obId, ...dateFilter } }),
            this.db.laporan_karyawan.count({ where: { ob_id: obId, status: "SELESAI", ...dateFilter } })
        ]);

        const completedReports = await this.db.laporan_karyawan.findMany({
            where: {
                ob_id: obId,
                status: "SELESAI",
                dikerjakan_at: { not: null },
                selesai_at: { not: null },
                ...dateFilter
            },
            select: {
                dikerjakan_at: true,
                selesai_at: true
            }
        });

        let totalDurationMinutes = 0;
        let count = 0;
        for (const report of completedReports) {
            if (report.dikerjakan_at && report.selesai_at) {
                const diffMs = report.selesai_at.getTime() - report.dikerjakan_at.getTime();
                totalDurationMinutes += diffMs / 60000;
                count++;
            }
        }
        const rataRataKecepatanPengerjaan = count > 0 ? parseFloat((totalDurationMinutes / count).toFixed(1)) : 0;
        

        const result = { 
            laporanDiterima, 
            laporanSelesai,
            rataRataKecepatanPengerjaan
        };
        return result;
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

        const result: PaginatedResponse<ProfileReport> = {
            items,
            next_cursor: nextCursor,
            meta: {
                total_items: total,
                current_page: 1,
                limit,
                total_pages: Math.ceil(total / limit)
            }
        };
        return result;
    }

    private buildWhereClause(baseFilter: Prisma.Laporan_karyawanWhereInput, search?: string | null, status?: string | null): Prisma.Laporan_karyawanWhereInput {
        const filters: Prisma.Laporan_karyawanWhereInput[] = [baseFilter];

        if (search) {
            filters.push({
                OR: [
                    { deskripsi_kendala: { contains: search, mode: "insensitive" } },
                    { lantai: { lokasi: { nama_lokasi: { contains: search, mode: "insensitive" } } } }
                ]
            });
        }

        if (status) {
            filters.push({ status: { equals: status, mode: "insensitive" } });
        }

        const whereClause = filters.length === 1 ? filters[0]! : { AND: filters };
        return whereClause;
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

    private buildHistorySearchWhere(query: AdminLaporanHistoryQuery): Prisma.Laporan_karyawanWhereInput {
        const where: Prisma.Laporan_karyawanWhereInput = {};

        if (query.user_id) {
            where.OR = [
                { ob_id: query.user_id },
                { pelapor_id: query.user_id },
            ];
        }

        if (query.search) {
            const searchFilter = {
                OR: [
                    { deskripsi_kendala: { contains: query.search, mode: "insensitive" as const } },
                    { kategori: { nama_kategori: { contains: query.search, mode: "insensitive" as const } } },
                    { lantai: { lokasi: { nama_lokasi: { contains: query.search, mode: "insensitive" as const } } } },
                    { pelapor: { nama_lengkap: { contains: query.search, mode: "insensitive" as const } } },
                ],
            };

            if (where.OR) {
                where.AND = [searchFilter];
            } else {
                where.OR = searchFilter.OR;
            }
        }

        return where;
    }


    private buildAdminLaporanOrderBy(query: AdminLaporanQuery): Prisma.Laporan_karyawanOrderByWithRelationInput[] {
        const sortOrder = query.sort_order;

        if (query.sort_by === "nama_karyawan") {
            const orderBy: Prisma.Laporan_karyawanOrderByWithRelationInput[] = [
                { pelapor: { nama_lengkap: sortOrder } },
                { created_at: "desc" }
            ];
            return orderBy;
        }

        if (query.sort_by === "lokasi") {
            const orderBy: Prisma.Laporan_karyawanOrderByWithRelationInput[] = [
                { lantai: { lokasi: { nama_lokasi: sortOrder } } },
                { created_at: "desc" }
            ];
            return orderBy;
        }

        if (query.sort_by === "prioritas") {
            const orderBy: Prisma.Laporan_karyawanOrderByWithRelationInput[] = [
                { prioritas: sortOrder },
                { created_at: "desc" }
            ];
            return orderBy;
        }

        if (query.sort_by === "status") {
            const orderBy: Prisma.Laporan_karyawanOrderByWithRelationInput[] = [
                { status: sortOrder },
                { created_at: "desc" }
            ];
            return orderBy;
        }

        const defaultSortField = query.sort_by === "updated_at" ? "updated_at" : "created_at";
        const defaultOrderBy: Prisma.Laporan_karyawanOrderByWithRelationInput[] = [
            { [defaultSortField]: sortOrder },
            { id: "desc" }
        ];
        return defaultOrderBy;
    }
}
