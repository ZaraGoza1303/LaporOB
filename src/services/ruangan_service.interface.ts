import type { CreateRuanganReq, UpdateRuanganReq } from "../dto/ruangan.js";
import type { Ruangan } from "../generated/prisma/client.js";

export interface IRuanganService {
    getAll(lantaiId?: string): Promise<Ruangan[]>;
    getById(lantaiId: string | undefined, ruanganId: string): Promise<Ruangan | null>;
    create(req: CreateRuanganReq): Promise<{ id: string }>;
    update(lantaiId: string | undefined, ruanganId: string, req: UpdateRuanganReq): Promise<void>;
    delete(lantaiId: string | undefined, ruanganId: string): Promise<void>;
}
