import type { Kategori, Lantai, Lokasi, Laporan_karyawan, User } from "../generated/prisma/client.js";
import type { PaginatedResponse } from "../dto/response.js";

export type ProfileUser = User & {
    role: {
        nama_role: string;
    };
};

export type ProfileReport = Laporan_karyawan & {
    kategori: Kategori;
    lantai: Lantai & {
        lokasi: Lokasi;
    };
    ob: User | null;
};

export interface IProfileRepository {
    getUserById(userId: string): Promise<ProfileUser | null>;
    getReportsByUserId(userId: string, limit: number, cursor?: string | null, search?: string | null, status?: string | null): Promise<PaginatedResponse<ProfileReport>>;
}
