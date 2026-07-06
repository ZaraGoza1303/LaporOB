import type { PaginatedResponse } from '../dto/response.js';
import type { CreateLaporanKaryawanInput, CreateUserReq, CreateUserRes, UpdateUserReq, UserHomeRes } from '../dto/users.js';
import type { User } from '../generated/prisma/client.js';

export interface IUsersService {
    getAll(page: number, limit: number, search?: string | null): Promise<PaginatedResponse<User>>
    getByID(userId: string): Promise<User | null>
    create(req: CreateUserReq): Promise<CreateUserRes>;
    update(userId: string, req: UpdateUserReq, file?: Express.Multer.File): Promise<void>;
    delete(userId: string): Promise<void>;

    getHomeStats(userId: string): Promise<UserHomeRes>
    createReport(userId: string, req: CreateLaporanKaryawanInput): Promise<void>;
}