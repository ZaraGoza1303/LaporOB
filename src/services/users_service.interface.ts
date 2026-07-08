import type { CreateUserReq, CreateUserRes, UpdateUserReq } from "../dto/users.js";
import type { PaginatedResponse } from "../dto/response.js";
import type { UserSearchQuery } from "../dto/admin.js";
import type { User } from "../generated/prisma/client.js";

export interface IUsersService {
    getAll(page: number, limit: number, query: UserSearchQuery): Promise<PaginatedResponse<User>>
    getByID(userId: string): Promise<any | null>
    getProfile(userId: string): Promise<{
        id: string;
        nama_lengkap: string;
        username: string;
        email: string;
        role: string;
        profile_picture: string | null;
    }>;
    create(req: CreateUserReq): Promise<CreateUserRes>;
    update(userId: string, req: UpdateUserReq, file?: Express.Multer.File): Promise<void>;
    delete(userId: string): Promise<void>;
}
