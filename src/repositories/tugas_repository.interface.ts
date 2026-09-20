import type { Tugas, Prisma } from "../generated/prisma/client.js";
import type { TugasCreateInput, TugasUpdateInput } from "../generated/prisma/models.js";
import type { PaginatedResponse } from "../types/response.js";

export type TugasApprovalItem = Prisma.TugasGetPayload<{
    include: {
        ob: { select: { id: true; nama_lengkap: true } };
        lantai: { include: { lokasi: { select: { nama_lokasi: true } } } };
        kategori: { select: { id: true; nama_kategori: true } };
    };
}>;

export type TugasDetailPayload = Prisma.TugasGetPayload<{
    include: {
        kategori: true;
        lantai: { include: { lokasi: true } };
        ob: { omit: { password: true } };
    };
}>;

export interface ITugasRepository {
    getAll(kategoriId?: string): Promise<TugasDetailPayload[]>;
    getAllPaginated(page: number, limit: number, search?: string): Promise<PaginatedResponse<TugasDetailPayload>>;
    getByID(tugasId: string): Promise<Tugas | null>
    getDetailByID(tugasId: string): Promise<TugasDetailPayload | null>
    insert(req: TugasCreateInput): Promise<string>;
    update(tugasId: string, req: TugasUpdateInput): Promise<void>;
    delete(tugasId: string): Promise<void>;
    getAllTugasForOb(obId: string): Promise<Tugas[]>;
    claimByOb(tugasId: string, obId: string, fotoAwal: string[]): Promise<void>;
    completeByOb(tugasId: string, obId: string, fotoAkhir: string[], catatan?: string): Promise<void>;
    getCompletedTugasByObId(obId: string, limit: number, cursor?: string | null, search?: string | null): Promise<PaginatedResponse<TugasDetailPayload>>;
    countCompletedTugasByObId(obId: string): Promise<number>;
    getMatchingToday(today: Date): Promise<Tugas[]>;
    getPendingApproval(period: { start: Date; end: Date }, lokasiId?: string): Promise<TugasApprovalItem[]>;
    approve(tugasId: string, adminId: string): Promise<void>;
}
