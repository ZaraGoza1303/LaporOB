import type { UserSearchQuery } from "../dto/admin.js";
import type { PaginatedResponse } from "../dto/response.js";
import type { User, Role, Prisma } from "../generated/prisma/client.js";
import type { UserCreateInput, UserTokenCreateInput, UserUpdateInput } from "../generated/prisma/models.js";
import type { PenugasanWithLokasi } from "./ob_repository.interface.js";

export type ProfileUser = User & {
    role: {
        nama_role: string;
    };
};

export type UserWithRoleAndToken = User & {
    role: { nama_role: string };
    tokens: { id: string; token_hash: string; type: string; expired_at: Date; created_at: Date; used_at: Date | null }[];
};

export type UserDetailWithPenugasan = UserWithRoleAndToken & {
    penugasan: PenugasanWithLokasi[];
};


export interface IUsersRepository {
    getAll(page: number, limit: number, query: UserSearchQuery): Promise<PaginatedResponse<User>>
    getByID(userId: string): Promise<UserWithRoleAndToken | null>
    getByEmail(email: string): Promise<User | null>
    insert(req: UserCreateInput): Promise<User>;
    update(userId: string, req: UserUpdateInput): Promise<void>;
    delete(userId: string): Promise<void>;
    insertActivationToken(activationToken: UserTokenCreateInput): Promise<void>;
    markTokenAsUsed(tokenId: string): Promise<void>;
    getUserWithRoleById(userId: string): Promise<ProfileUser | null>;
    getByRole(nama_role: string): Promise<User[]>;
    getRoles(): Promise<Role[]>;
    syncObLocations(obId: string, lokasiIds: string[], bulan: number, tahun: number, tx?: Prisma.TransactionClient): Promise<void>;
    getObActiveAssignments(obId: string, bulan: number, tahun: number): Promise<PenugasanWithLokasi[]>;
    transaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T>;
}
