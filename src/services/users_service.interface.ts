import type { CreateUserReq, CreateUserRes, UpdateProfileReq, UpdateUserReq, UserProfileResponse } from "../dto/users.js";
import type { PaginatedResponse } from "../dto/response.js";
import type { UserSearchQuery } from "../dto/admin.js";
import type { User } from "../generated/prisma/client.js";

export interface IUsersService {
    getAll(page: number, limit: number, query: UserSearchQuery): Promise<PaginatedResponse<User>>;
    getByID(userId: string): Promise<any | null>;
    getByRole(nama_role: string): Promise<User[]>;
    create(req: CreateUserReq): Promise<CreateUserRes>;
    update(userId: string, req: UpdateUserReq | UpdateProfileReq): Promise<void>;
    delete(userId: string): Promise<void>;
    getProfile(userId: string): Promise<UserProfileResponse>;
    completeActivation(userId: string, password: string, tokenId: string): Promise<void>;
}