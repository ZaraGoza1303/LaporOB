import type { CreateTugasReq, UpdateTugasReq } from "../dto/tugas.js";
import type { TugasDetailRes } from "../types/tugas.js";
import type { Tugas } from "../generated/prisma/client.js";
import type { TugasApprovalItem } from "../repositories/tugas_repository.interface.js";
import type { PaginatedResponse } from "../types/response.js";

export interface ITugasService {
    getAll(kategoriId?: string): Promise<Tugas[]>
    getAllPaginated(page: number, limit: number, search?: string): Promise<PaginatedResponse<TugasDetailRes>>;
    getByID(tugasId: string): Promise<Tugas | null>
    getDetailByID(tugasId: string): Promise<TugasDetailRes | null>
    create(req: CreateTugasReq): Promise<void>;
    update(tugasId: string, req: UpdateTugasReq): Promise<void>;
    delete(tugasId: string): Promise<void>;
    
    getAllTugasForOb(obId: string): Promise<Tugas[]>;
    claimTugas(tugasId: string, obId: string): Promise<void>;
    completeTugas(tugasId: string, obId: string): Promise<void>;
    getScheduledTugas(obId: string, today: Date): Promise<Tugas[]>;
    getPendingApprovalTugas(period: { start: Date; end: Date }, lokasiId?: string): Promise<TugasApprovalItem[]>;
    approveTugas(tugasId: string, adminId: string): Promise<void>;
}
