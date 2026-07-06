import type { PaginatedResponse } from "../dto/response.js";
import type { UserActivityRes } from "../dto/users.js";
import type { User, Kategori, Lantai, Lokasi, Laporan_karyawan, Prisma } from "../generated/prisma/client.js";
import type { Laporan_karyawanCreateInput, UserCreateInput, UserTokenCreateInput, UserUpdateInput } from "../generated/prisma/models.js";

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

export type DetailReportPayload = Prisma.Laporan_karyawanGetPayload<{
    include: {
        kategori: true;
        lantai: { include: { lokasi: true } };
        ob: true;
        pelapor: true;
    };
}>;

export interface IUsersRepository {
    getAll(page: number, limit: number, search?: string | null): Promise<PaginatedResponse<User>>
    getByID(userId: string): Promise<User | null>
    insert(req: UserCreateInput): Promise<User>;
    update(userId: string, req: UserUpdateInput): Promise<void>;
    delete(userId: string): Promise<void>;

    getActivity(userId: string): Promise<UserActivityRes[]>
    insertActivationToken(activationToken: UserTokenCreateInput): Promise<void>;
    insertReport(req: Laporan_karyawanCreateInput): Promise<void>;
    markTokenAsUsed(tokenId: string): Promise<void>;

    getUserWithRoleById(userId: string): Promise<ProfileUser | null>;
    getReportsByUserId(userId: string, limit: number, cursor?: string | null, search?: string | null, status?: string | null): Promise<PaginatedResponse<ProfileReport>>;
    getReportsByObId(obId: string, limit: number, cursor?: string | null, search?: string | null, status?: string | null): Promise<PaginatedResponse<ProfileReport>>;
    getReportDetailById(reportId: string): Promise<DetailReportPayload | null>;
}