import type { UserStatsRes, AdminLaporanQuery } from "../dto/admin.js";
import type { PaginatedResponse } from "../dto/response.js";
import { PrismaClient } from "../generated/prisma/client.js";
import type { IAdminRepository, DailyChecklistObReport, PenugasanObWithDetails, RiwayatTugasObReport } from "./admin_repository.interface.js";
import { CHECKLIST_STATUS, LAPORAN_STATUS, TUGAS_STATUS, USER_ROLE } from "../utils/constants.js";

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
            this.db.role.findFirst({ where: { nama_role: USER_ROLE.OB } })
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

    async getDailyChecklistOB(tanggal: Date): Promise<DailyChecklistObReport[]> {
        const startOfDay = new Date(tanggal);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(tanggal);
        endOfDay.setHours(23, 59, 59, 999);

        const obRole = await this.db.role.findFirst({
            where: {
                nama_role: {
                    equals: USER_ROLE.OB,
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

        const result = obs.map(ob => {
            const obChecklists = checklists.filter(c => c.ob_id === ob.id);
            const total = obChecklists.length;
            const selesai = obChecklists.filter(c => c.status === CHECKLIST_STATUS.SELESAI).length;
            const persentase = total > 0 ? Math.round((selesai / total) * 100) : 0;

            const firstChecklist = obChecklists[0];
            const lokasi = firstChecklist?.lantai?.lokasi
                ? `${firstChecklist.lantai.lokasi.nama_lokasi} Lantai ${firstChecklist.lantai.nomor_lantai}`
                : "Lokasi tidak ditentukan";

            const mapped = {
                nama_ob: ob.nama_lengkap,
                lokasi,
                selesai,
                total,
                persentase
            };
            return mapped;
        });
        return result;
    }
    
    async getRiwayatTugasOB(page: number, limit: number): Promise<PaginatedResponse<RiwayatTugasObReport>> {
        const offset = (page - 1) * limit;

        const obRole = await this.db.role.findFirst({
            where: {
                nama_role: {
                    equals: USER_ROLE.OB,
                    mode: "insensitive"
                }
            }
        });

        if (!obRole) {
            return {
                items: [],
                next_cursor: null,
                meta: {
                    total_items: 0,
                    current_page: page,
                    limit,
                    total_pages: 0
                }
            };
        }

        const obs = await this.db.user.findMany({
            where: {
                role_id: obRole.id,
                is_deleted: false,
                is_active: true
            }
        });

        const obIds = obs.map(ob => ob.id);

        const where = {
            ob_id: { in: obIds },
            is_active: true,
            status: "SELESAI"
        };

        const [riwayatTugas, total] = await Promise.all([
            this.db.tugas.findMany({
                where,
                include: {
                    ob: true,
                    kategori: true
                },
                orderBy: {
                    updated_at: "desc"
                },
                skip: offset,
                take: limit
            }),
            this.db.tugas.count({ where })
        ]);

        const items = riwayatTugas.map(tugas => {
            let durasi = "-";
            if (tugas.dikerjakan_at && tugas.selesai_at) {
                const diffMs = tugas.selesai_at.getTime() - tugas.dikerjakan_at.getTime();
                const diffMins = Math.round(diffMs / 60000);
                durasi = `${diffMins}m`;
            }

            return {
                nama_ob: tugas.ob?.nama_lengkap || "Tanpa Nama",
                nama_tugas: tugas.nama_tugas,
                kategori: tugas.kategori.nama_kategori,
                durasi: durasi,
                status: tugas.status
            };
        });

        return {
            items,
            next_cursor: null,
            meta: {
                total_items: total,
                current_page: page,
                limit,
                total_pages: Math.ceil(total / limit)
            }
        };
    }

    async assignObToLocations(obId: string, lokasiIds: string[], bulan: number, tahun: number): Promise<void> {
        await this.db.$transaction([
            this.db.penugasanOb.deleteMany({
                where: {
                    ob_id: obId,
                    bulan: bulan,
                    tahun: tahun,
                }
            }),
            ...(lokasiIds.length > 0 ? [
                this.db.penugasanOb.createMany({
                    data: lokasiIds.map(lokasiId => ({
                        ob_id: obId,
                        lokasi_id: lokasiId,
                        bulan: bulan,
                        tahun: tahun,
                    }))
                })
            ] : [])
        ]);
    }

    async getPenugasanByPeriode(bulan: number, tahun: number): Promise<PenugasanObWithDetails[]> {
        const penugasan = await this.db.penugasanOb.findMany({
            where: {
                bulan,
                tahun,
            },
            include: {
                ob: {
                    select: {
                        id: true,
                        nama_lengkap: true,
                        username: true,
                        email: true,
                    }
                },
                lokasi: true,
            }
        });
        return penugasan;
    }

    async countTugasBelumDikerjakan(startDate: Date, endDate: Date): Promise<number> {
        return this.db.tugas.count({
            where: {
                is_active: true,
                status: TUGAS_STATUS.BELUM_DIKERJAKAN,
                created_at: {
                    gte: startDate,
                    lte: endDate,
                }
            }
        });
    }
}
