import { z } from 'zod';
import { type LaporanStatus } from '../utils/constants.js';

export const GetDashboardQuerySchema = z.object({
    period: z.enum(['weekly', 'monthly', 'yearly']).default('weekly'),
});
export type GetDashboardQuery = z.infer<typeof GetDashboardQuerySchema>;


export interface StatDetail {
    count: number;
    trend_value: number;
    is_positive: boolean;
}

export interface KpiResponse {
    total_reports: StatDetail;
    completed_reports: StatDetail;
    ongoing_reports: StatDetail;
}

export interface BarChartResponse {
    label: string;
    count: number;
}

export interface PieChartResponse {
    status: LaporanStatus;
    percentage: number;
    count: number;
}

export interface RecentActivityResponse {
    id: string;
    title: string;
    location: string;
    status: LaporanStatus;
    assignee_name: string | null;
    timestamp: Date;
}

export interface DashboardMainResponse {
    kpi: KpiResponse;
    bar_chart: BarChartResponse[];
    pie_chart: PieChartResponse[];
    recent_activities: RecentActivityResponse[];
}