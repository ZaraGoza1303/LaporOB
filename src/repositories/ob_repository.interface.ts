import type { User, Prisma } from "../generated/prisma/client.js";

export type UserWithoutPassword = Omit<User, "password">;

export type PenugasanWithLokasi = Prisma.PenugasanObGetPayload<{
    include: { lokasi: true }
}>;

export interface IObRepository {
    getObById(obId: string): Promise<UserWithoutPassword | null>;
    getActiveAssignments(obId: string, bulan: number, tahun: number): Promise<PenugasanWithLokasi[]>;
}