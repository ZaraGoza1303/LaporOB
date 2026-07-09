import type { MappedReportDetailRes } from '../dto/users.js';

export interface ILaporanService {
    getReportDetail(reportId: string, userId: string, role: string): Promise<MappedReportDetailRes>;
}
