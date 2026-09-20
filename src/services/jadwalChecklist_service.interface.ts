import type { CreateJadwalChecklistReq, UpdateJadwalChecklistReq } from "../dto/jadwal_checklist.js";
import type { JadwalChecklist } from "../generated/prisma/client.js";

export interface IJadwalChecklistService {
    create(userId: string, req: CreateJadwalChecklistReq): Promise<{ id: string }>;
    getByID(jadwalId: string): Promise<JadwalChecklist | null>;
    getAll(): Promise<JadwalChecklist[]>;
    update(jadwalId: string, req: UpdateJadwalChecklistReq): Promise<void>;
    delete(jadwalId: string): Promise<void>;
    generateToday(): Promise<number>;
}
