import type { PrismaClient, User } from "../generated/prisma/client.js";
import type { IObRepository } from "./ob_repository.interface.js";
import { LAPORAN_STATUS } from "../utils/constants.js";

export class ObRepository implements IObRepository {
    private db: PrismaClient;

    constructor(db: PrismaClient) {
        this.db = db;
    }

    async getObById(obId: string): Promise<User | null> {
        return this.db.user.findFirst({
            where: { id: obId },
                include: {
                    role:true,
                    tokens: {
                        orderBy: {
                            created_at: 'desc'
                        },
                        take: 1
                    }
                }
        })
    }

    async getTodayChecklists(obId: string, tanggal: Date): Promise<any[]> {
        const startOfDay = new Date(tanggal);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(tanggal);
        endOfDay.setHours(23, 59, 59, 999);

        return this.db.checklist_harian.findMany({
            where: {
                ob_id: obId,
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
                ob_id: obId,
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

    async getObPerformanceStats(obId: string): Promise<{ tasksCompleted: number, komplain_ditangani: number; rejected: number }> {
        const [completedChecklists, completedLaporan, rejectedLaporan] = await Promise.all([
            this.db.checklist_harian.count({
                where: {
                    ob_id: obId,
                    status: 'SELESAI'
                }
            }),
            this.db.laporan_karyawan.count({
                where: {
                    ob_id: obId,
                    status: 'SELESAI'
                }
            }),
            this.db.laporan_karyawan.count({
                where: {
                    ob_id: obId,
                    status: 'DITOLAK'
                }
            })
        ]);

        return {
            tasksCompleted: completedChecklists,
            komplain_ditangani: completedLaporan,
            rejected: rejectedLaporan
        };
    }
}