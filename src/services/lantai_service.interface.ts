import type { CreateLantaiReq, UpdateLantaiReq } from "../dto/lantai.js";
import type { Lantai } from "../generated/prisma/client.js";

export interface ILantaiService {
    getAll(lokasiId?: string): Promise<Lantai[]>;
    getById(lokasiId: string | undefined, lantaiId: string): Promise<Lantai | null>;
    create(req: CreateLantaiReq): Promise<void>;
    update(lokasiId: string | undefined, lantaiId: string, req: UpdateLantaiReq): Promise<void>;
    delete(lokasiId: string | undefined, lantaiId: string): Promise<void>;
}