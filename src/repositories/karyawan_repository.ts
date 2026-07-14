import type { PrismaClient } from "../generated/prisma/client.js";
import type { IKaryawanRepository } from "./karyawan_repository.inteface.js";

export class KaryawanRepository implements IKaryawanRepository {
    private db: PrismaClient;

    constructor(db: PrismaClient) {
        this.db = db;
    }

    async getKaryawanPerformanceStats(userId: string): Promise<number> {
        const data = await this.db.laporan_karyawan.count({
            where: {
                pelapor_id: userId
            }
        })

        return data;
    }
    
}