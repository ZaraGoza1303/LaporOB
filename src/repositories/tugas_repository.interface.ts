import type { Tugas, Prisma } from "../generated/prisma/client.js";
import type { TugasCreateInput, TugasUpdateInput } from "../generated/prisma/models.js";

export type TugasApprovalItem = Prisma.TugasGetPayload<{
    include: {
        ob: { select: { id: true; nama_lengkap: true } };
        lantai: { include: { lokasi: { select: { nama_lokasi: true } } } };
        kategori: { select: { id: true; nama_kategori: true } };
    };
}>;

export interface ITugasRepository {
    getAll(kategoriId?: string): Promise<Tugas[]>
    getByID(tugasId: string): Promise<Tugas | null>
    insert(req: TugasCreateInput): Promise<void>;
    update(tugasId: string, req: TugasUpdateInput): Promise<void>;
    delete(tugasId: string): Promise<void>;
    getAllTugasForOb(obId: string): Promise<Tugas[]>;
    claimByOb(tugasId: string, obId: string): Promise<void>;
    completeByOb(tugasId: string, obId: string): Promise<void>;
    getMatchingToday(today: Date): Promise<Tugas[]>;
    getPendingApproval(period: { start: Date; end: Date }, lokasiId?: string): Promise<TugasApprovalItem[]>;
    approve(tugasId: string, adminId: string): Promise<void>;
}
