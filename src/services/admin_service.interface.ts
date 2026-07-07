import type { UserSearchQuery, UserStatsRes } from '../dto/admin.js';
import type { PaginatedResponse } from '../dto/response.js';
import type { CreateUserReq, CreateUserRes, UpdateUserReq } from '../dto/users.js';
import type { User } from '../generated/prisma/client.js';

export interface IAdminService {
    getAll(page: number, limit: number, query: UserSearchQuery): Promise<PaginatedResponse<User>>
    getByID(userId: string): Promise<any | null>
    create(req: CreateUserReq): Promise<CreateUserRes>;
    update(userId: string, req: UpdateUserReq, file?: Express.Multer.File): Promise<void>;
    delete(userId: string): Promise<void>;

    getUserStats(): Promise<UserStatsRes>;
}
