import type { Ruangan } from "../generated/prisma/client.js";
import type { RuanganCreateInput, RuanganUpdateInput } from "../generated/prisma/models.js";

export interface IRuanganRepository {
    getAll(lantaiId: string): Promise<Ruangan[]>;
    getById(lantaiId: string, ruanganId: string): Promise<Ruangan | null>;
    insert(req: RuanganCreateInput): Promise<void>;
    update(lantaiId: string, ruanganId: string, req: RuanganUpdateInput): Promise<void>;
    delete(lantaiId: string, ruanganId: string): Promise<void>;
}
