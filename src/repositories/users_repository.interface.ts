import type { PaginatedResponse } from "../dto/response.js";
import type { User } from "../generated/prisma/client.js";
import type { UserCreateInput, UserUpdateInput } from "../generated/prisma/models.js";

export interface IUsersRepository {
    getAll(page: number, limit: number, search?: string | null): Promise<PaginatedResponse<User>>
    getByID(userId: string): Promise<User | null>
    insert(req: UserCreateInput): Promise<void>;
    update(userId: string, req: UserUpdateInput): Promise<void>;
    delete(userId: string): Promise<void>;
}