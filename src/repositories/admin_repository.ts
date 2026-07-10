import type { AdminLaporanQuery, UserStatsRes } from "../dto/admin.js";
import type { PaginatedResponse } from "../dto/response.js";
import { Prisma, type PrismaClient } from "../generated/prisma/client.js";
import type { IAdminRepository, RecentActivityPayload, ReportSummaryPayload, LaporanDetailPayload, AdminLaporanPayload, LokasiTerpopulerPayload } from "./admin_repository.interface.js";
import { LAPORAN_STATUS, CHECKLIST_STATUS } from "../utils/constants.js";

export class AdminRepository implements IAdminRepository {
    private db: PrismaClient;

    constructor(db: PrismaClient) {
        this.db = db;
    }

    async getUserStats(): Promise<UserStatsRes> {
        const notDeleted = { is_deleted: false };

        const [totalUsers, totalActiveUsers, totalNonActiveUsers, roleOb] = await Promise.all([
            this.db.user.count({ where: notDeleted }),
            this.db.user.count({ where: { ...notDeleted, is_active: true } }),
            this.db.user.count({ where: { ...notDeleted, is_active: false } }),
            this.db.role.findFirst({ where: { nama_role: 'ob' } })
        ]);

        let totalOb = 0;
        if (roleOb) {
            totalOb = await this.db.user.count({
                where: {
                    role_id: roleOb.id,
                    is_deleted: false,
                }
            });
        }

        const res: UserStatsRes = {
            totalUsers,
            activeUsers: totalActiveUsers,
            nonActiveUsers: totalNonActiveUsers,
            totalOB: totalOb,
        }

        return res;
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
        });
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
        });
    }
    async getReportDetailById(id: string): Promise<LaporanDetailPayload | null> {
    return await this.db.laporan_karyawan.findUnique({
        where: { id },
        include: {
            pelapor: true,
            ob: true,
            lantai: { include: { lokasi: true } },
            kategori: true,
            histori_pekerjaan: true
        }
    });
}

    async getAllLaporan(page: number, limit: number, query: AdminLaporanQuery): Promise<PaginatedResponse<AdminLaporanPayload>> {
        const offset = (page - 1) * limit;
        const where = this.buildLaporanWhereClause(query);
        const orderBy = this.buildLaporanOrderBy(query);

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
            items: laporan,
            next_cursor: null,
            meta: {
                total_items: total_laporan,
                current_page: page,
                limit,
                total_pages: Math.ceil(total_laporan / limit)
            }
        }
    }

    async getLokasiTerpopuler(limit: number, query: AdminLaporanQuery): Promise<LokasiTerpopulerPayload[]> {
        const where = this.buildLaporanWhereClause(query);

        const laporan = await this.db.laporan_karyawan.findMany({
            where,
            include: {
                lantai: {
                    include: {
                        lokasi: true
                    }
                }
            }
        });

        const lokasiMap = new Map<string, LokasiTerpopulerPayload>();

        laporan.forEach((item) => {
            const lokasiId = item.lantai?.lokasi?.id ?? null;
            const namaLokasi = item.lantai?.lokasi?.nama_lokasi ?? "Lokasi tidak diketahui";
            const key = lokasiId ?? namaLokasi;
            const current = lokasiMap.get(key);

            lokasiMap.set(key, {
                lokasi_id: lokasiId,
                nama_lokasi: namaLokasi,
                total_laporan: (current?.total_laporan ?? 0) + 1
            });
        });

        return Array.from(lokasiMap.values())
            .sort((a, b) => b.total_laporan - a.total_laporan)
            .slice(0, limit);
    }

    async countLaporanAktif(query: AdminLaporanQuery): Promise<number> {
        const where = this.buildLaporanWhereClause(query);
        where.status = {
            in: [LAPORAN_STATUS.BELUM_DIKERJAKAN, LAPORAN_STATUS.PENDING]
        };

        return this.db.laporan_karyawan.count({ where });
    }

    private buildLaporanWhereClause(query: AdminLaporanQuery): Prisma.Laporan_karyawanWhereInput {
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

    private buildLaporanOrderBy(query: AdminLaporanQuery): Prisma.Laporan_karyawanOrderByWithRelationInput[] {
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
    async getDailyChecklistOB(tanggal: Date): Promise<any[]> {
        const startOfDay = new Date(tanggal);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(tanggal);
        endOfDay.setHours(23, 59, 59, 999);

        const obRole = await this.db.role.findFirst({
            where: {
                nama_role: {
                    equals: "ob",
                    mode: "insensitive"
                }
            }
        });

        if (!obRole) {
            return [];
        }

        const obs = await this.db.user.findMany({
            where: {
                role_id: obRole.id,
                is_deleted: false,
                is_active: true
            }
        });

        const checklists = await this.db.checklist_harian.findMany({
            where: {
                tanggal: {
                    gte: startOfDay,
                    lte: endOfDay
                },
                ob_id: {
                    in: obs.map(ob => ob.id)
                }
            },
            include: {
                lantai: {
                    include: {
                        lokasi: true
                    }
                }
            }
        });

        return obs.map(ob => {
            const obChecklists = checklists.filter(c => c.ob_id === ob.id);
            const total = obChecklists.length;
            const selesai = obChecklists.filter(c => c.status === CHECKLIST_STATUS.SELESAI).length;
            const persentase = total > 0 ? Math.round((selesai / total) * 100) : 0;

            const firstChecklist = obChecklists[0];
            const lokasi = firstChecklist?.lantai?.lokasi
                ? `${firstChecklist.lantai.lokasi.nama_lokasi} Lantai ${firstChecklist.lantai.nomor_lantai}`
                : "Lokasi tidak ditentukan";

            return {
                nama_ob: ob.nama_lengkap,
                lokasi,
                selesai,
                total,
                persentase
            };
        });
    }
}

