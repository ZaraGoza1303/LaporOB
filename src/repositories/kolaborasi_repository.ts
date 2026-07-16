import type { PrismaClient, KolaborasiLaporan } from "../generated/prisma/client.js";
import type { IKolaborasiRepository, KolaborasiLaporanWithOb } from "./kolaborasi_repository.interface.js";
import { KOLABORASI_STATUS } from "../utils/constants.js";

export class KolaborasiRepository implements IKolaborasiRepository {
    private db: PrismaClient;

    constructor(db: PrismaClient) {
        this.db = db;
    }

    async findById(id: string): Promise<KolaborasiLaporan | null> {
        const kolaborasi = await this.db.kolaborasiLaporan.findUnique({ where: { id } });
        return kolaborasi;
    }

    async findByLaporanAndOb(laporanId: string, obId: string): Promise<KolaborasiLaporan | null> {
        const kolaborasi = await this.db.kolaborasiLaporan.findUnique({
            where: {
                laporan_id_ob_id: {
                    laporan_id: laporanId,
                    ob_id: obId,
                }
            }
        });
        return kolaborasi;
    }

    async findPendingByLaporanId(laporanId: string): Promise<KolaborasiLaporanWithOb[]> {
        const kolaborasi = await this.db.kolaborasiLaporan.findMany({
            where: { laporan_id: laporanId, status: KOLABORASI_STATUS.PENDING },
            include: { ob: { select: { id: true, nama_lengkap: true } } }
        }) as unknown as KolaborasiLaporanWithOb[];
        return kolaborasi;
    }

    async findApprovedByLaporanId(laporanId: string): Promise<KolaborasiLaporanWithOb[]> {
        const kolaborasi = await this.db.kolaborasiLaporan.findMany({
            where: { laporan_id: laporanId, status: KOLABORASI_STATUS.APPROVED },
            include: { ob: { select: { id: true, nama_lengkap: true } } }
        }) as unknown as KolaborasiLaporanWithOb[];
        return kolaborasi;
    }

    async findApprovedByObId(obId: string): Promise<KolaborasiLaporan[]> {
        const kolaborasi = await this.db.kolaborasiLaporan.findMany({
            where: { ob_id: obId, status: KOLABORASI_STATUS.APPROVED }
        });
        return kolaborasi;
    }

    async create(laporanId: string, obId: string): Promise<KolaborasiLaporan> {
        const kolaborasi = await this.db.kolaborasiLaporan.create({
            data: {
                laporan_id: laporanId,
                ob_id: obId,
                status: KOLABORASI_STATUS.PENDING,
            }
        });
        return kolaborasi;
    }

    async updateStatus(id: string, status: string): Promise<KolaborasiLaporan> {
        const kolaborasi = await this.db.kolaborasiLaporan.update({
            where: { id },
            data: { status }
        });
        return kolaborasi;
    }

    async delete(id: string): Promise<void> {
        await this.db.kolaborasiLaporan.delete({
            where: { id }
        });
    }

    async findApprovedByLaporanAndOb(laporanId: string, obId: string): Promise<KolaborasiLaporan | null> {
        const kolaborasi = await this.db.kolaborasiLaporan.findFirst({
            where: {
                laporan_id: laporanId,
                ob_id: obId,
                status: KOLABORASI_STATUS.APPROVED,
            }
        });
        return kolaborasi;
    }

    async countByLaporanAndStatus(laporanId: string, status: string): Promise<number> {
        const count = await this.db.kolaborasiLaporan.count({
            where: { laporan_id: laporanId, status }
        });
        return count;
    }
}
