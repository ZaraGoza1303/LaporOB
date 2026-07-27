import type { CreateUserReq, UpdateProfileReq, UpdateUserReq, UserProfileResponse } from "../dto/users.js";
import type { PaginatedResponse } from "../dto/response.js";
import type { UserSearchQuery } from "../dto/admin.js";
import type { User, Role } from "../generated/prisma/client.js";
import type { UserWithRoleAndToken, UserDetailWithPenugasan } from "../repositories/users_repository.interface.js";

export interface IUsersService {
    getAll(page: number, limit: number, query: UserSearchQuery): Promise<PaginatedResponse<User>>;
    getByID(userId: string): Promise<UserDetailWithPenugasan | null>;
    getByEmail(email: string): Promise<User | null>;
    getByRole(nama_role: string): Promise<User[]>;
    create(req: CreateUserReq): Promise<void>;
    update(userId: string, req: UpdateUserReq): Promise<void>;
    delete(userId: string): Promise<void>;
    getProfile(userId: string): Promise<UserProfileResponse>;
    completeActivation(userId: string, password: string, tokenId: string): Promise<void>;
    getRoles(): Promise<Role[]>;
    renewActivationToken(userId: string): Promise<void>;
    createPasswordResetToken(userId: string, tokenHash: string, expiredAt: Date): Promise<void>;
    resetUserPassword(userId: string, passwordHash: string, tokenId?: string | null): Promise<void>;
}