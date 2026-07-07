import type { UserSearchQuery, UserStatsRes } from "../dto/admin.js";
import type { PaginatedResponse } from "../dto/response.js";
import type { User } from "../generated/prisma/client.js";
import type { UserCreateInput, UserTokenCreateInput, UserUpdateInput } from "../generated/prisma/models.js";

export interface IAdminRepository {
    getAll(page: number, limit: number, query: UserSearchQuery): Promise<PaginatedResponse<User>>
    getByID(userId: string): Promise<any | null>
    insert(req: UserCreateInput): Promise<User>;
    update(userId: string, req: UserUpdateInput): Promise<void>;
    delete(userId: string): Promise<void>;

    insertActivationToken(activationToken: UserTokenCreateInput): Promise<void>;
    getUserStats(): Promise<UserStatsRes>;
}
