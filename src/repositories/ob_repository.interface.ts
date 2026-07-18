import type { User, Prisma } from "../generated/prisma/client.js";

export type PenugasanWithLokasi = Prisma.PenugasanObGetPayload<{
    include: { lokasi: true }
}>;

export interface IObRepository {
    getObById(obId: string): Promise<User | null>;
    getActiveAssignments(obId: string, bulan: number, tahun: number): Promise<PenugasanWithLokasi[]>;
}