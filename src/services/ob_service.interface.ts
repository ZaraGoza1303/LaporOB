import type { ObHomeRes } from "../dto/ob.js";

export interface IObService {
    getHomeStats(obId: string): Promise<ObHomeRes>;
}