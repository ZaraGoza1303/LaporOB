import type { PrismaClient } from "../generated/prisma/client.js";
import type { IAdminRepository, RecentActivityPayload, ReportSummaryPayload } from "./admin_repository.interface.js";

export class AdminRepository implements IAdminRepository {
    private db: PrismaClient;

    constructor(db: PrismaClient) {
        this.db = db;
    }

    async getRecentActivities(limit: number): Promise<RecentActivityPayload[]> {
        return this.db.laporan_karyawan.findMany({
            include: {
                lantai: {
                    include: { lokasi: true }
                },
                ob: true
            },
            orderBy: {
                updated_at: 'desc'
            },
            take: limit
        });
    }

    async getReportsByDateRange(startDate: Date, endDate: Date): Promise<ReportSummaryPayload[]> {
        return this.db.laporan_karyawan.findMany({
            where: {
                created_at: {
                    gte: startDate,
                    lte: endDate
                }
            },
            select: {
                id: true,
                status: true,
                created_at: true
            }
        });
    }
}