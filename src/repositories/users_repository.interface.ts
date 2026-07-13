import type { UserSearchQuery } from "../dto/admin.js";
import type { PaginatedResponse } from "../dto/response.js";
import type { User } from "../generated/prisma/client.js";
import type { UserCreateInput, UserTokenCreateInput, UserUpdateInput } from "../generated/prisma/models.js";

export type ProfileUser = User & {
    role: {
        nama_role: string;
    };
};

export interface IUsersRepository {
    getAll(page: number, limit: number, query: UserSearchQuery): Promise<PaginatedResponse<User>>
    getByID(userId: string): Promise<any | null>
    insert(req: UserCreateInput): Promise<User>;
    update(userId: string, req: UserUpdateInput): Promise<void>;
    delete(userId: string): Promise<void>;
    insertActivationToken(activationToken: UserTokenCreateInput): Promise<void>;
    markTokenAsUsed(tokenId: string): Promise<void>;
    getUserWithRoleById(userId: string): Promise<ProfileUser | null>;
    getByRole(nama_role: string): Promise<User[]>;
    countLaporanByUserId(userId: string): Promise<number>;
}
