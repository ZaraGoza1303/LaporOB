import type { PaginatedResponse } from '../dto/response.js';
import type { CreateUserReq, UpdateUserReq } from '../dto/users.js';
import type { User } from '../generated/prisma/client.js';

export interface IUsersService {
    getAll(page: number, limit: number, search?: string | null): Promise<PaginatedResponse<User>>
    getByID(userId: string): Promise<User | null>
    create(req: CreateUserReq): Promise<void>;
    update(userId: string, req: UpdateUserReq): Promise<void>;
    delete(userId: string): Promise<void>;
}