import type { ObHomeRes } from "../dto/ob.js";
import type { ObProfileResponse } from "../dto/users.js";

export interface IObService {
    getHomeStats(obId: string): Promise<ObHomeRes>;
    getProfile(obId: string): Promise<ObProfileResponse>;
}