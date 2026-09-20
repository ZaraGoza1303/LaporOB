import type { Ruangan } from "../generated/prisma/client.js";
import type { RuanganCreateInput, RuanganUpdateInput } from "../generated/prisma/models.js";

export interface IRuanganRepository {
    getAll(lantaiId?: string): Promise<Ruangan[]>;
    getById(lantaiId: string | undefined, ruanganId: string): Promise<Ruangan | null>;
    insert(req: RuanganCreateInput): Promise<string>;
    update(lantaiId: string | undefined, ruanganId: string, req: RuanganUpdateInput): Promise<void>;
    delete(lantaiId: string | undefined, ruanganId: string): Promise<void>;
}
