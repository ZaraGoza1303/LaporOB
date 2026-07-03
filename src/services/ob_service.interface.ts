import type { ObDashboardRes } from "../dto/ob.js";

export interface IObService {
    getHomeStats(obId: string): Promise<ObDashboardRes>;
}