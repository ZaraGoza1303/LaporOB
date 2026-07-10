import type { CreateTugasReq, UpdateTugasReq } from "../dto/tugas.js";
import type { Tugas } from "../generated/prisma/client.js";

export interface ITugasService {
    getAll(kategoriId?: string): Promise<Tugas[]>
    getByID(tugasId: string): Promise<Tugas | null>
    create(req: CreateTugasReq): Promise<void>;
    update(tugasId: string, req: UpdateTugasReq): Promise<void>;
    delete(tugasId: string): Promise<void>;
}
