import type { Laporan_karyawan, PrismaClient, User } from "../generated/prisma/client.js";
import type { IObRepository } from "./ob_repository.interface.js";

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
                ob_id: obId
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

   async updateLaporStatus(laporanId: string, obId: string, status: string, tambahanData: { catatan?: string; foto_masalah?: string; }): Promise<void> {
    await this.db.laporan_karyawan.update({
            where: {id: laporanId},
            data: {
                status: status,
                ob_id: obId,
                ...(tambahanData.catatan && { catatan: tambahanData.catatan}),

            histori_pekerjaan: {
                create: {
                    ob_id : obId,
                    status_aksi: status,
                    foto_selesai: tambahanData.foto_masalah ?? null
                    }
                }
            }
        });
    }
}