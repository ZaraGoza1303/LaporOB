import type { PrismaClient } from "../generated/prisma/client.js";
import type { IObRepository, PenugasanWithLokasi, UserWithoutPassword } from "./ob_repository.interface.js";

export class ObRepository implements IObRepository {
    private db: PrismaClient;

    constructor(db: PrismaClient) {
        this.db = db;
    }

    async getObById(obId: string): Promise<UserWithoutPassword | null> {
        const user = await this.db.user.findFirst({
            where: { id: obId },
            omit: { password: true },
            include: {
                role: true
            }
        });
        return user;
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
}