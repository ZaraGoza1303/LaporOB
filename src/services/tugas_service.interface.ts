import type { CreateTugasReq, UpdateTugasReq } from "../dto/tugas.js";
import type { TugasDetailRes } from "../types/tugas.js";
import type { Tugas } from "../generated/prisma/client.js";
import type { TugasApprovalItem } from "../repositories/tugas_repository.interface.js";
import type { PaginatedResponse } from "../types/response.js";

export interface ITugasService {
    getAll(kategoriId?: string): Promise<TugasDetailRes[]>;
    getAllPaginated(page: number, limit: number, search?: string): Promise<PaginatedResponse<TugasDetailRes>>;
    getByID(tugasId: string): Promise<Tugas | null>
    getDetailByID(tugasId: string): Promise<TugasDetailRes | null>
    create(req: CreateTugasReq): Promise<{ id: string }>;
    update(tugasId: string, req: UpdateTugasReq): Promise<void>;
    delete(tugasId: string): Promise<void>;
    
    getAllTugasForOb(obId: string): Promise<Tugas[]>;
    claimTugas(tugasId: string, obId: string, fotoAwal: string[]): Promise<void>;
    completeTugas(tugasId: string, obId: string, fotoAkhir: string[], catatan?: string): Promise<void>;
    getCompletedTugasForOb(obId: string, limit: number, cursor?: string | null, search?: string | null): Promise<PaginatedResponse<TugasDetailRes>>;
    countCompletedTugasForOb(obId: string): Promise<number>;
    getScheduledTugas(obId: string, today: Date): Promise<Tugas[]>;
    getPendingApprovalTugas(period: { start: Date; end: Date }, lokasiId?: string): Promise<TugasApprovalItem[]>;
    approveTugas(tugasId: string, adminId: string): Promise<void>;
}
