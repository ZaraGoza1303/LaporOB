import type { ObHomeRes } from "../dto/ob.js";
import type { ObProfileResponse } from "../dto/users.js";
import type { PenugasanWithLokasi } from "../repositories/ob_repository.interface.js";

export interface IObService {
    getHomeStats(obId: string): Promise<ObHomeRes>;
    getProfile(obId: string): Promise<ObProfileResponse>;
    getActiveAssignments(obId: string, bulan: number, tahun: number): Promise<PenugasanWithLokasi[]>;
}