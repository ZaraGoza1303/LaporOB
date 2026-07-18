import type { PrismaClient, User } from "../generated/prisma/client.js";
import type { IObRepository, PenugasanWithLokasi } from "./ob_repository.interface.js";

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