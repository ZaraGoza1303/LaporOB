import type { Lantai } from "../generated/prisma/client.js";
import type { LantaiCreateInput, LantaiUpdateInput } from "../generated/prisma/models.js";

export interface ILantaiRepository {
    getAll(lokasiId: string): Promise<Lantai[]>;
    getById(lokasiId: string, lantaiId: string): Promise<Lantai | null>;
    insert(req: LantaiCreateInput): Promise<void>;
    update(lokasiId: string, lantaiId: string, req: LantaiUpdateInput): Promise<void>;
    delete(lokasiId:string, lantaiId: string): Promise<void>;
}