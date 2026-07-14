import type { PrismaClient, KolaborasiLaporan } from "../generated/prisma/client.js";
import type { IKolaborasiRepository } from "./kolaborasi_repository.interface.js";

export class KolaborasiRepository implements IKolaborasiRepository {
    private db: PrismaClient;

    constructor(db: PrismaClient) {
        this.db = db;
    }

    async findById(id: string): Promise<KolaborasiLaporan | null> {
        return this.db.kolaborasiLaporan.findUnique({ where: { id } });
    }

    async findByLaporanAndOb(laporanId: string, obId: string): Promise<KolaborasiLaporan | null> {
        return this.db.kolaborasiLaporan.findUnique({
            where: {
                laporan_id_ob_id: {
                    laporan_id: laporanId,
                    ob_id: obId,
                }
            }
        });
    }

    async findPendingByLaporanId(laporanId: string): Promise<KolaborasiLaporan[]> {
        return this.db.kolaborasiLaporan.findMany({
            where: { laporan_id: laporanId, status: "PENDING" },
            include: { ob: { select: { id: true, nama_lengkap: true } } }
        });
    }

    async findApprovedByLaporanId(laporanId: string): Promise<KolaborasiLaporan[]> {
        return this.db.kolaborasiLaporan.findMany({
            where: { laporan_id: laporanId, status: "APPROVED" },
            include: { ob: { select: { id: true, nama_lengkap: true } } }
        });
    }

    async findApprovedByObId(obId: string): Promise<KolaborasiLaporan[]> {
        return this.db.kolaborasiLaporan.findMany({
            where: { ob_id: obId, status: "APPROVED" }
        });
    }

    async create(laporanId: string, obId: string): Promise<KolaborasiLaporan> {
        return this.db.kolaborasiLaporan.create({
            data: {
                laporan_id: laporanId,
                ob_id: obId,
                status: "PENDING",
            }
        });
    }

    async updateStatus(id: string, status: string): Promise<KolaborasiLaporan> {
        return this.db.kolaborasiLaporan.update({
            where: { id },
            data: { status }
        });
    }

    async countByLaporanAndStatus(laporanId: string, status: string): Promise<number> {
        return this.db.kolaborasiLaporan.count({
            where: { laporan_id: laporanId, status }
        });
    }
}
