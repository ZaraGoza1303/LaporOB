import type { UserSearchQuery, UserStatsRes } from "../dto/admin.js";
import type { PaginatedResponse } from "../dto/response.js";
import type { CreateUserReq, CreateUserRes, UpdateUserReq } from "../dto/users.js";
import type { User } from "../generated/prisma/client.js";
import type { UserCreateInput, UserTokenCreateInput, UserUpdateInput } from "../generated/prisma/models.js";
import type { IAdminRepository } from "../repositories/admin_repository.interface.js";
import { handlePrismaError } from "../utils/error.js";
import { generateActivationToken } from "../utils/token.js";
import { buildActivationUrl, resolveFileUrl } from "../utils/url.js";
import type { IAdminService } from "./admin_service.interface.js";
import { StorageServiceFactory } from "./storage_service.factory.js";
import bcrypt from 'bcrypt';

export class AdminService implements IAdminService {
    private adminRepo: IAdminRepository;
    private storageService = StorageServiceFactory.getProvider();

    constructor(adminRepo: IAdminRepository) {
        this.adminRepo = adminRepo;
    }

    async getAll(page: number, limit: number, query: UserSearchQuery): Promise<PaginatedResponse<User>> {
        try {
            const users = await this.adminRepo.getAll(page, limit, query);
            if (users && users.items) {
                users.items = users.items.map(user => {
                    if (user.profile_picture) {
                        user.profile_picture = resolveFileUrl(user.profile_picture);
                    }
                    return user;
                });
            }
            return users;
        } catch (err) {
            handlePrismaError(err)
        }
    }

    async getByID(userId: string): Promise<User | null> {
        try {
            const user = await this.adminRepo.getByID(userId);
            if (user && user.profile_picture) {
                user.profile_picture = resolveFileUrl(user.profile_picture);
            }
            return user;
        } catch (err) {
            handlePrismaError(err)
        }
    }

    async create(req: CreateUserReq): Promise<CreateUserRes> {
        try {
            const hashedPassword = await bcrypt.hash(req.password, 16);
            const activationToken = generateActivationToken(1);

            const userReq: UserCreateInput = {
                role: {
                    connect: { id: req.role_id }
                },
                username: req.username,
                email: req.email,
                password: hashedPassword,
                nama_lengkap: req.nama_lengkap,
            }

            const createdUser = await this.adminRepo.insert(userReq);

            const activationUserReq: UserTokenCreateInput = {
                user: {
                    connect: { id: createdUser.id }
                },
                token_hash: activationToken.tokenHash,
                type: "activation",
                expired_at: activationToken.expiredAt,
            }

            await this.adminRepo.insertActivationToken(activationUserReq);
            const activationUrl = buildActivationUrl(activationToken.token);

            const res: CreateUserRes = {
                activationUrl
            }

            return res;
        } catch (err) {
            handlePrismaError(err)
        }
    }

    async update(userId: string, req: UpdateUserReq, file?: Express.Multer.File): Promise<void> {
        try {
            const userReq: UserUpdateInput = {}

            if (file) {
                const oldUser = await this.adminRepo.getByID(userId);
                const oldPp = oldUser?.profile_picture || "";
                userReq.profile_picture = await this.storageService.updateFile(file, oldPp);
            }

            if (req.username !== undefined) userReq.username = req.username;
            if (req.nama_lengkap !== undefined) userReq.nama_lengkap = req.nama_lengkap;
            if (req.password !== undefined) userReq.password = await bcrypt.hash(req.password, 16);
            if (req.role_id !== undefined) {
                userReq.role = {
                    connect: { id: req.role_id }
                };
            }

            await this.adminRepo.update(userId, userReq as any);
        } catch (err) {
            handlePrismaError(err)
        }
    }

    async delete(userId: string): Promise<void> {
        try {
            await this.adminRepo.delete(userId);
        } catch (err) {
            handlePrismaError(err)
        }
    }

    async getUserStats(): Promise<UserStatsRes> {
        try {
            const data = await this.adminRepo.getUserStats();
            return data;
        } catch (err) {
            handlePrismaError(err)
        }
    }
}
