import type { PrismaClient, User } from "../generated/prisma/client.js";
import type { IObRepository } from "./ob_repository.interface.js";
import { LAPORAN_STATUS } from "../utils/constants.js";
import type { PeriodRange } from "../utils/date.js";

export class ObRepository implements IObRepository {
    private db: PrismaClient;

    constructor(db: PrismaClient) {
        this.db = db;
    }

    async getObById(obId: string): Promise<User | null> {
        return this.db.user.findFirst({
            where: {
                id: obId,
                role: {
                    nama_role: {
                        equals: "ob",
                        mode: "insensitive"
                    }
                },
                is_deleted: false
            }
        });
    }

    async getTodayChecklists(obId: string, tanggal: Date): Promise<any[]> {
        const startOfDay = new Date(tanggal);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(tanggal);
        endOfDay.setHours(23, 59, 59, 999);

        return this.db.checklist_harian.findMany({
            where: {
                OR: [
                    { ob_id: obId },
                    { ob_id: null }
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
    }

    async countTodayChecklists(obId: string, tanggal: Date): Promise<number> {
        const startOfDay = new Date(tanggal);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(tanggal);
        endOfDay.setHours(23, 59, 59, 999);

        return this.db.checklist_harian.count({
            where: {
                OR: [
                    { ob_id: obId },
                    { ob_id: null }
                ],
                tanggal: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            }
        });
    }

    async getReports(obId: string): Promise<any[]> {
        return this.db.laporan_karyawan.findMany({
            where: {
                OR: [
                    { ob_id: obId },
                    { ob_id: null }
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
    }

    async ambilLaporan(laporanId: string, obId: string): Promise<void> {
        await this.db.laporan_karyawan.update({
            where: { id: laporanId },
            data: {
                status: LAPORAN_STATUS.PENDING,
                ob_id: obId,
            }
        });
    }

    async createHistoriPekerjaan(laporanId: string, fotoSelesai: string[], catatan: string): Promise<void> {
        await this.db.$transaction([
            this.db.histori_pekerjaan.create({
                data: {
                    laporan_karyawan_id: laporanId,
                    foto_selesai: fotoSelesai,
                    catatan: catatan,
                }
            }),
            this.db.laporan_karyawan.update({
                where: { id: laporanId },
                data: {
                    status: LAPORAN_STATUS.SELESAI,
                }
            })
        ]);
    }

    async tolakLaporan(laporanId: string, fotoSelesai: string[], catatan: string): Promise<void> {
        await this.db.$transaction([
            this.db.histori_pekerjaan.create({
                data: {
                    laporan_karyawan_id: laporanId,
                    foto_selesai: fotoSelesai,
                    catatan: catatan,
                }
            }),
            this.db.laporan_karyawan.update({
                where: { id: laporanId },
                data: {
                    status: LAPORAN_STATUS.DITOLAK,
                    alasan_gagal: catatan,
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

        return {
            laporanDiterima,
            laporanSelesai
        };
    }
}