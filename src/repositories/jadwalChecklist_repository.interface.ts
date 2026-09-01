import type { JadwalChecklist } from "../generated/prisma/client.js";
import type { Prisma } from "../generated/prisma/client.js";
import type { JadwalChecklistUncheckedCreateInput, JadwalChecklistUncheckedUpdateInput } from "../generated/prisma/models.js";

export interface IJadwalChecklistRepository {
    insert(req: JadwalChecklistUncheckedCreateInput): Promise<JadwalChecklist>;
    transaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T>;
    getByID(jadwalId: string): Promise<JadwalChecklist | null>;
    getAll(): Promise<JadwalChecklist[]>;
    update(jadwalId: string, req: JadwalChecklistUncheckedUpdateInput): Promise<void>;
    delete(jadwalId: string): Promise<void>;
    getMatchingToday(today: Date): Promise<JadwalChecklist[]>;
}
