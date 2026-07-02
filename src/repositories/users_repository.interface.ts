import type { PaginatedResponse } from "../dto/response.js";
import type { User } from "../generated/prisma/client.js";
import type { UserCreateInput, UserTokenCreateInput, UserUpdateInput } from "../generated/prisma/models.js";

export interface IUsersRepository {
    getAll(page: number, limit: number, search?: string | null): Promise<PaginatedResponse<User>>
    getByID(userId: string): Promise<User | null>
    insert(req: UserCreateInput): Promise<User>;
    update(userId: string, req: UserUpdateInput): Promise<void>;
    delete(userId: string): Promise<void>;

    insertActivationToken(activationToken: UserTokenCreateInput): Promise<void>;
    markTokenAsUsed(tokenId: string): Promise<void>;
}