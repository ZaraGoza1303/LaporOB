import type { PrismaClient, User } from "../generated/prisma/client.js";
import type { IObRepository, ChecklistHarianWithDetails, LaporanKaryawanWithDetails, PenugasanWithLokasi } from "./ob_repository.interface.js";
import { LAPORAN_STATUS, CHECKLIST_STATUS } from "../utils/constants.js";
import type { PeriodRange } from "../utils/date.js";

export class ObRepository implements IObRepository {
    private db: PrismaClient;

    constructor(db: PrismaClient) {
        this.db = db;
    }

    async getObById(obId: string): Promise<User | null> {
        const user = await this.db.user.findFirst({
            where: { id: obId },
            include: {
                role: true,
                tokens: {
                    orderBy: {
                        created_at: 'desc'
                    },
                    take: 1
                }
            }
        });
        return user;
    }

    async getTodayChecklists(obId: string, tanggal: Date): Promise<ChecklistHarianWithDetails[]> {
        const startOfDay = new Date(tanggal);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(tanggal);
        endOfDay.setHours(23, 59, 59, 999);

        const lokasiIds = await this.getActiveLokasiIds(obId, tanggal);

        const ownChecklists = await this.db.checklist_harian.findMany({
            where: {
                OR: [
                    { ob_id: obId },
                    {
                        ob_id: null,
                        lantai: {
                            lokasi_id: {
                                in: lokasiIds
                            }
                        }
                    }
                ],
                tanggal: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            },
            include: {
                tugas: true,
                kategori: true,
                lantai: {
                    include: {
                        lokasi: true
                    }
                }
            },
            orderBy: {
                created_at: 'asc'
            },
            take: 2
        });

        if (ownChecklists.length >= 2) {
            const result = ownChecklists as unknown as ChecklistHarianWithDetails[];
            return result;
        }

        const backupChecklists = await this.db.checklist_harian.findMany({
            where: {
                ob_id: null,
                lantai: {
                    lokasi_id: {
                        notIn: lokasiIds
                    }
                },
                tanggal: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            },
            include: {
                tugas: true,
                kategori: true,
                lantai: {
                    include: {
                        lokasi: true
                    }
                }
            },
            orderBy: {
                created_at: 'asc'
            },
            take: 2 - ownChecklists.length
        });

        const mergedChecklists = [...ownChecklists, ...backupChecklists] as unknown as ChecklistHarianWithDetails[];
        return mergedChecklists;
    }

    async countTodayChecklists(obId: string, tanggal: Date): Promise<number> {
        const startOfDay = new Date(tanggal);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(tanggal);
        endOfDay.setHours(23, 59, 59, 999);

        const lokasiIds = await this.getActiveLokasiIds(obId, tanggal);

        const count = await this.db.checklist_harian.count({
            where: {
                OR: [
                    { ob_id: obId },
                    {
                        ob_id: null,
                        lantai: {
                            lokasi_id: {
                                in: lokasiIds
                            }
                        }
                    }
                ],
                tanggal: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            }
        });
        return count;
    }

    async getReports(obId: string): Promise<LaporanKaryawanWithDetails[]> {
        const now = new Date();
        const lokasiIds = await this.getActiveLokasiIds(obId, now);

        const ownReports = await this.db.laporan_karyawan.findMany({
            where: {
                OR: [

                    { ob_id: obId },
                    {
                        ob_id: null,
                        status: { not: LAPORAN_STATUS.PENDING }
                    }
                ]
            },
            include: {
                kategori: true,
                lantai: {
                    include: {
                        lokasi: true
                    }
                }
            },
            orderBy: {
                created_at: 'desc'
            },
            take: 3
        });

        if (ownReports.length >= 3) {
            const result = ownReports as unknown as LaporanKaryawanWithDetails[];
            return result;
        }

        const backupReports = await this.db.laporan_karyawan.findMany({
            where: {
                ob_id: null,
                lantai: {
                    lokasi_id: {
                        notIn: lokasiIds
                    }
                }
            },
            include: {
                kategori: true,
                lantai: {
                    include: {
                        lokasi: true
                    }
                }
            },
            orderBy: {
                created_at: 'desc'
            },
            take: 3 - ownReports.length
        });

        const mergedReports = [...ownReports, ...backupReports] as unknown as LaporanKaryawanWithDetails[];
        return mergedReports;
    }


    async getActiveAssignments(obId: string, bulan: number, tahun: number): Promise<PenugasanWithLokasi[]> {
        const assignments = await this.db.penugasanOb.findMany({
            where: {
                ob_id: obId,
                bulan: bulan,
                tahun: tahun,
            },
            include: {
                lokasi: true
            }
        });
        return assignments;
    }

    async ambilLaporan(laporanId: string, obId: string): Promise<void> {
        const now = new Date();
        await this.db.laporan_karyawan.update({
            where: { id: laporanId },
            data: {
                status: LAPORAN_STATUS.PENDING,
                ob_id: obId,
                dikerjakan_at: now,
            },
        });
    }

    async ambilChecklist(checklistId: string, obId: string): Promise<void> {
        await this.db.checklist_harian.update({
            where: { id: checklistId },
            data: {
                ob_id: obId,
                status: CHECKLIST_STATUS.SEDANG_DIKERJAKAN,
            }
        });
    }

    async createHistoriPekerjaan(laporanId: string, obId: string, fotoSelesai: string[], catatan: string): Promise<void> {
        const now = new Date();
        await this.db.$transaction([
            this.db.histori_pekerjaan.create({
                data: {
                    laporan: {
                        connect: { id: laporanId }
                    },
                    ob: {
                        connect: { id: obId }
                    },
                    foto_selesai: { set: fotoSelesai },
                    catatan: catatan,
                }
            }),
            this.db.laporan_karyawan.update({
                where: { id: laporanId },
                data: {
                    status: LAPORAN_STATUS.SELESAI,
                    selesai_at: now,
                }
            })
        ]);
    }

    async batalkanLaporan(laporanId: string, obId: string, fotoSelesai: string[], catatan: string): Promise<void> {
        const now = new Date();
        await this.db.$transaction([
            this.db.histori_pekerjaan.create({
                data: {
                    laporan: {
                        connect: { id: laporanId }
                    },
                    ob: {
                        connect: { id: obId }
                    },
                    foto_selesai: { set: fotoSelesai },
                    catatan: catatan,
                }
            }),
            this.db.laporan_karyawan.update({
                where: { id: laporanId },
                data: {
                    status: LAPORAN_STATUS.BELUM_DIKERJAKAN,
                    ob_id: null,
                    alasan_gagal: catatan,
                    dibatalkan_at: now,
                }
            })
        ]);
    }

    async getObPerformanceStats(obId: string, dateRange?: PeriodRange): Promise<{ laporanDiterima: number, laporanSelesai: number }> {
        const dateFilter = dateRange
            ? { created_at: { gte: dateRange.start, lte: dateRange.end } }
            : {};

        const [laporanDiterima, laporanSelesai] = await Promise.all([
            this.db.laporan_karyawan.count({
                where: {
                    ob_id: obId,
                    ...dateFilter
                }
            }),
            this.db.laporan_karyawan.count({
                where: {
                    ob_id: obId,
                    status: LAPORAN_STATUS.SELESAI,
                    ...dateFilter
                }
            })
        ]);

        const stats = {
            laporanDiterima,
            laporanSelesai
        };
        return stats;
    }

    private async getActiveLokasiIds(obId: string, date: Date): Promise<string[]> {
        const assignments = await this.db.penugasanOb.findMany({
            where: {
                ob_id: obId,
                bulan: date.getMonth() + 1,
                tahun: date.getFullYear(),
            },
            select: {
                lokasi_id: true
            }
        });

        const lokasiIds = assignments.map(a => a.lokasi_id);
        return lokasiIds;
    }
}
