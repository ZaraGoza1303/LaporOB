import type { CreateLantaiReq, UpdateLantaiReq } from "../dto/lantai.js";
import type { Lantai } from "../generated/prisma/client.js";

export interface ILantaiService {
    getAll(lokasiId: string): Promise<Lantai[]>;
    getById(lokasiId: string, lantaiId: string): Promise<Lantai | null>;
    create(req: CreateLantaiReq): Promise<void>;
    update(lokasiId: string, lantaiId: string, req: UpdateLantaiReq): Promise<void>;
    delete(lokasiId:string, lantaiId: string): Promise<void>;
}