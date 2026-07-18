import type { Tugas } from "../generated/prisma/client.js";
import type { TugasCreateInput, TugasUpdateInput } from "../generated/prisma/models.js";
import type { ObTugasItem } from "../dto/ob.js";

export interface ITugasRepository {
    getAll(kategoriId?: string): Promise<Tugas[]>
    getByID(tugasId: string): Promise<Tugas | null>
    insert(req: TugasCreateInput): Promise<void>;
    update(tugasId: string, req: TugasUpdateInput): Promise<void>;
    delete(tugasId: string): Promise<void>;
    getAvailableForOb(obId: string): Promise<ObTugasItem[]>;
    claimByOb(tugasId: string, obId: string): Promise<void>;
    completeByOb(tugasId: string, obId: string): Promise<void>;
}
