import type { UserStatsRes, AdminLaporanQuery, StatsTugasQuery } from "../dto/admin.js";
import { Prisma, PrismaClient } from "../generated/prisma/client.js";
import type { IAdminRepository, DailyChecklistObReport, PenugasanObWithDetails, StatsTugasResult } from "./admin_repository.interface.js";
import { CHECKLIST_STATUS, LAPORAN_STATUS, USER_ROLE } from "../utils/constants.js";
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
                where: { ...where, status: LAPORAN_STATUS.PENDING },
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
}
