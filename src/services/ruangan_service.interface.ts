import type { CreateRuanganReq, UpdateRuanganReq } from "../dto/ruangan.js";
import type { Ruangan } from "../generated/prisma/client.js";

export interface IRuanganService {
    getAll(lantaiId: string): Promise<Ruangan[]>;
    getById(lantaiId: string, ruanganId: string): Promise<Ruangan | null>;
    create(req: CreateRuanganReq): Promise<void>;
    update(lantaiId: string, ruanganId: string, req: UpdateRuanganReq): Promise<void>;
    delete(lantaiId: string, ruanganId: string): Promise<void>;
}
