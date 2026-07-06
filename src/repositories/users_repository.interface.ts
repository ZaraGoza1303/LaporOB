import type { PaginatedResponse } from "../dto/response.js";
import type { UserActivityRes } from "../dto/users.js";
import type { User } from "../generated/prisma/client.js";
import type { Laporan_karyawanCreateInput, UserCreateInput, UserTokenCreateInput, UserUpdateInput } from "../generated/prisma/models.js";

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
}