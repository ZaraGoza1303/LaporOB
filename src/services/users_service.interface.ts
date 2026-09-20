import type { CreateUserReq, UpdateProfileReq, UpdateUserReq } from "../dto/users.js";
import type { UserProfileResponse, PublicUser } from "../types/users.js";
import type { PaginatedResponse } from "../types/response.js";
import type { UserSearchQuery } from "../dto/admin.js";
import type { User, Role } from "../generated/prisma/client.js";
import type { UserWithRoleAndToken, UserDetailWithPenugasan } from "../repositories/users_repository.interface.js";

export interface IUsersService {
    getAll(page: number, limit: number, query: UserSearchQuery): Promise<PaginatedResponse<PublicUser>>;
    getByID(userId: string): Promise<UserDetailWithPenugasan | null>;
    getByEmail(email: string): Promise<PublicUser | null>;
    getUserWithPasswordById(userId: string): Promise<User | null>;
    getByRole(nama_role: string): Promise<PublicUser[]>;
    create(req: CreateUserReq): Promise<{ id: string }>;
    update(userId: string, req: UpdateUserReq): Promise<void>;
    delete(userId: string): Promise<void>;
    getProfile(userId: string): Promise<UserProfileResponse>;
    completeActivation(userId: string, password: string, tokenId: string): Promise<void>;
    getRoles(): Promise<Role[]>;
    renewActivationToken(userId: string): Promise<void>;
    createPasswordResetToken(userId: string, tokenHash: string, expiredAt: Date): Promise<void>;
    resetUserPassword(userId: string, passwordHash: string, tokenId?: string | null): Promise<void>;
}