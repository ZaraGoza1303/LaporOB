import type { UserStatsRes } from "../dto/admin.js";

export interface IAdminRepository {
    getUserStats(): Promise<UserStatsRes>;
    getDailyChecklistOB(tanggal: Date): Promise<any[]>;
}
