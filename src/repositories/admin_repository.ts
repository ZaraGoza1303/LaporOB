import type { UserStatsRes, AdminLaporanQuery, StatsTugasQuery } from "../dto/admin.js";
import type { PaginatedResponse } from "../dto/response.js";
import { Prisma, PrismaClient } from "../generated/prisma/client.js";
import type { IAdminRepository, DailyChecklistObReport, PenugasanObWithDetails, RiwayatTugasObReport, StatsTugasResult, ObRankingRawData, TrenLaporanBulananRaw } from "./admin_repository.interface.js";
import { CHECKLIST_STATUS, LAPORAN_STATUS, TUGAS_STATUS, USER_ROLE } from "../utils/constants.js";
import { calculatePeriodRange } from "../utils/date.js";

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

    async getStatsTugas(query: StatsTugasQuery): Promise<StatsTugasResult> {
        const { period, lokasi_id } = query;
        const dateRange = calculatePeriodRange(period);

        const checklistWhere: Prisma.Checklist_harianWhereInput = {
            tanggal: { gte: dateRange.start, lte: dateRange.end },
        };
        const tugasWhere: Prisma.TugasWhereInput = {
            created_at: { gte: dateRange.start, lte: dateRange.end },
        };

        if (lokasi_id) {
            checklistWhere.lantai = { lokasi_id };
            tugasWhere.lantai = { lokasi_id };
        }

        const [
            checklistTotal,
            checklistDiproses,
            checklistMenunggu,
            tugasTotal,
            tugasDiproses,
            tugasMenunggu,
        ] = await Promise.all([
            this.db.checklist_harian.count({ where: checklistWhere }),
            this.db.checklist_harian.count({
                where: { ...checklistWhere, status: CHECKLIST_STATUS.SEDANG_DIKERJAKAN },
            }),
            this.db.checklist_harian.count({
                where: { ...checklistWhere, status: CHECKLIST_STATUS.SELESAI, is_approved: false },
            }),
            this.db.tugas.count({ where: tugasWhere }),
            this.db.tugas.count({
                where: { ...tugasWhere, status: CHECKLIST_STATUS.SEDANG_DIKERJAKAN },
            }),
            this.db.tugas.count({
                where: { ...tugasWhere, status: CHECKLIST_STATUS.SELESAI, is_approved: false },
            }),
        ]);

        const result: StatsTugasResult = {
            checklist: { total: checklistTotal, diproses: checklistDiproses, menunggu: checklistMenunggu },
            tugas: { total: tugasTotal, diproses: tugasDiproses, menunggu: tugasMenunggu },
        };

        return result;
    }

    async getStatsLaporan(query: StatsTugasQuery): Promise<{ laporan_baru: number; sedang_dikerjakan: number; selesai_hari_ini: number }> {
        const { period, lokasi_id } = query;
        const dateRange = calculatePeriodRange(period);

        const where: Prisma.Laporan_karyawanWhereInput = {
            created_at: { gte: dateRange.start, lte: dateRange.end },
        };

        if (lokasi_id) {
            where.lantai = { lokasi_id };
        }

        const selesaiWhere: Prisma.Laporan_karyawanWhereInput = {
            ...where,
            status: LAPORAN_STATUS.SELESAI,
            selesai_at: { gte: dateRange.start, lte: dateRange.end },
        };

        const [laporanBaru, sedangDikerjakan, selesaiHariIni] = await Promise.all([
            this.db.laporan_karyawan.count({
                where: { ...where, status: LAPORAN_STATUS.BELUM_DIKERJAKAN },
            }),
            this.db.laporan_karyawan.count({
                where: { ...where, status: LAPORAN_STATUS.SEDANG_DIKERJAKAN },
            }),
            this.db.laporan_karyawan.count({
                where: selesaiWhere,
            }),
        ]);

        return {
            laporan_baru: laporanBaru,
            sedang_dikerjakan: sedangDikerjakan,
            selesai_hari_ini: selesaiHariIni,
        };
    }

    async getTotalApprovedTugas(): Promise<number> {
        const [checklist, tugas] = await Promise.all([
            this.db.checklist_harian.count({ where: { is_approved: true } }),
            this.db.tugas.count({ where: { is_approved: true } }),
        ]);
        return checklist + tugas;
    }

    async getTotalReviewedLaporan(): Promise<number> {
        return this.db.laporan_karyawan.count({
            where: {
                OR: [
                    { is_approved: true },
                    { status: LAPORAN_STATUS.DIBATALKAN },
                ],
            },
        });
    }

    async getObRanking(): Promise<ObRankingRawData[]> {
        const roleOb = await this.db.role.findFirst({ where: { nama_role: USER_ROLE.OB } });
        if (!roleOb) return [];

        const obUsers = await this.db.user.findMany({
            where: { role_id: roleOb.id, is_deleted: false },
            select: {
                id: true,
                nama_lengkap: true,
                profile_picture: true,
                skills: {
                    where: { diperoleh_at: { not: null } },
                    select: {
                        skill_id: true,
                        skill: { select: { nama_skill: true } },
                        diperoleh_at: true,
                    },
                },
            },
        });

        if (obUsers.length === 0) return [];

        const obIds = obUsers.map(u => u.id);

        const stats = await this.db.$queryRawUnsafe<
            Array<{ ob_id: string; total_claimed: number; total_selesai: number; avg_speed: number | null }>
        >(`
            SELECT
                ob_id,
                COUNT(*)::int as total_claimed,
                COUNT(*) FILTER (WHERE status = 'SELESAI')::int as total_selesai,
                ROUND(EXTRACT(EPOCH FROM AVG(selesai_at - dikerjakan_at) FILTER (WHERE selesai_at IS NOT NULL))::numeric, 0)::int as avg_speed
            FROM (
                SELECT ob_id, status, dikerjakan_at, selesai_at FROM tugas WHERE ob_id = ANY($1::uuid[]) AND dikerjakan_at IS NOT NULL
                UNION ALL
                SELECT ob_id, status, dikerjakan_at, selesai_at FROM checklist_harian WHERE ob_id = ANY($1::uuid[]) AND dikerjakan_at IS NOT NULL
                UNION ALL
                SELECT ob_id, status, dikerjakan_at, selesai_at FROM laporan_karyawan WHERE ob_id = ANY($1::uuid[]) AND dikerjakan_at IS NOT NULL
            ) AS all_tasks
            GROUP BY ob_id
        `, obIds);

        const statsMap = new Map(stats.map(s => [s.ob_id, s]));

        return obUsers.map(ob => {
            const s = statsMap.get(ob.id);
            return {
                ob_id: ob.id,
                nama_lengkap: ob.nama_lengkap,
                profile_picture: ob.profile_picture,
                skills: ob.skills.map(sk => ({
                    skill_id: sk.skill_id,
                    nama_skill: sk.skill.nama_skill,
                    diperoleh_at: sk.diperoleh_at!,
                })),
                total_tugas_claimed: s ? s.total_claimed : 0,
                total_tugas_selesai: s ? s.total_selesai : 0,
                rata_rata_kecepatan: s?.avg_speed ?? 0,
            };
        }).sort((a, b) => b.total_tugas_selesai - a.total_tugas_selesai);
    }

    async getObStatsByPeriod(startDate: Date, endDate: Date): Promise<ObRankingRawData[]> {
        const roleOb = await this.db.role.findFirst({ where: { nama_role: USER_ROLE.OB } });
        if (!roleOb) return [];

        const obUsers = await this.db.user.findMany({
            where: { role_id: roleOb.id, is_deleted: false },
            select: {
                id: true,
                nama_lengkap: true,
                profile_picture: true,
                skills: {
                    where: { diperoleh_at: { not: null } },
                    select: {
                        skill_id: true,
                        skill: { select: { nama_skill: true } },
                        diperoleh_at: true,
                    },
                },
            },
        });

        if (obUsers.length === 0) return [];
        const obIds = obUsers.map(u => u.id);

        const stats = await this.db.$queryRawUnsafe<
            Array<{ ob_id: string; total_claimed: number; total_selesai: number }>
        >(`
            SELECT
                ob_id,
                COUNT(*)::int as total_claimed,
                COUNT(*) FILTER (WHERE status = 'SELESAI')::int as total_selesai
            FROM (
                SELECT ob_id, status FROM tugas
                WHERE ob_id = ANY($1::uuid[]) AND dikerjakan_at IS NOT NULL AND dikerjakan_at >= $2 AND dikerjakan_at <= $3
                UNION ALL
                SELECT ob_id, status FROM checklist_harian
                WHERE ob_id = ANY($1::uuid[]) AND dikerjakan_at IS NOT NULL AND dikerjakan_at >= $2 AND dikerjakan_at <= $3
                UNION ALL
                SELECT ob_id, status FROM laporan_karyawan
                WHERE ob_id = ANY($1::uuid[]) AND dikerjakan_at IS NOT NULL AND dikerjakan_at >= $2 AND dikerjakan_at <= $3
            ) AS all_tasks
            GROUP BY ob_id
        `, obIds, startDate, endDate);

        const statsMap = new Map(stats.map(s => [s.ob_id, s]));

        return obUsers.map(ob => {
            const s = statsMap.get(ob.id);
            return {
                ob_id: ob.id,
                nama_lengkap: ob.nama_lengkap,
                profile_picture: ob.profile_picture,
                skills: ob.skills.map(sk => ({
                    skill_id: sk.skill_id,
                    nama_skill: sk.skill.nama_skill,
                    diperoleh_at: sk.diperoleh_at!,
                })),
                total_tugas_claimed: s ? s.total_claimed : 0,
                total_tugas_selesai: s ? s.total_selesai : 0,
                rata_rata_kecepatan: 0,
            };
        }).sort((a, b) => b.total_tugas_selesai - a.total_tugas_selesai);
    }

    async getLaporanMenungguInRange(startDate: Date, endDate: Date): Promise<number> {
        return this.db.laporan_karyawan.count({
            where: {
                status: { in: [LAPORAN_STATUS.BELUM_DIKERJAKAN, LAPORAN_STATUS.PENDING] },
                created_at: { gte: startDate, lte: endDate },
            },
        });
    }

    async getTrenLaporanBulanan(startDate: Date): Promise<TrenLaporanBulananRaw[]> {
        return this.db.$queryRawUnsafe<Array<TrenLaporanBulananRaw>>(`
            SELECT
                to_char(created_at, 'YYYY-MM') as bulan,
                COUNT(*)::int as total,
                COUNT(*) FILTER (WHERE status = 'BELUM_DIKERJAKAN')::int as baru,
                COUNT(*) FILTER (WHERE status = 'SEDANG_DIKERJAKAN')::int as sedang_dikerjakan,
                COUNT(*) FILTER (WHERE status = 'PENDING')::int as pending,
                COUNT(*) FILTER (WHERE status = 'SELESAI')::int as selesai,
                COUNT(*) FILTER (WHERE status = 'DIBATALKAN')::int as dibatalkan
            FROM laporan_karyawan
            WHERE created_at >= $1
            GROUP BY to_char(created_at, 'YYYY-MM')
            ORDER BY bulan ASC
        `, startDate);
    }

    async countActiveDays(userId: string): Promise<number> {
        const result = await this.db.$queryRaw<Array<{ count: bigint }>>`
            SELECT COUNT(DISTINCT DATE(created_at)) as count
            FROM user_session
            WHERE user_id = ${userId}::uuid
        `;
        return Number(result[0]?.count ?? 0);
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

    async countMenungguPersetujuan(startDate: Date, endDate: Date): Promise<number> {
        const [laporan, tugas, checklist] = await Promise.all([
            this.db.laporan_karyawan.count({
                where: {
                    status: { in: [LAPORAN_STATUS.PENDING, LAPORAN_STATUS.SELESAI] },
                    is_approved: false,
                    updated_at: { gte: startDate, lte: endDate }
                }
            }),
            this.db.tugas.count({
                where: {
                    is_active: true,
                    status: TUGAS_STATUS.SELESAI,
                    is_approved: false,
                    updated_at: { gte: startDate, lte: endDate }
                }
            }),
            this.db.checklist_harian.count({
                where: {
                    status: CHECKLIST_STATUS.SELESAI,
                    is_approved: false,
                    updated_at: { gte: startDate, lte: endDate }
                }
            })
        ]);
        return laporan + tugas + checklist;
    }
}
