import type { UserSearchQuery } from "../dto/admin.js";
import type { CreateUserReq, CreateUserRes, UpdateProfileReq, UpdateUserReq, UserProfileResponse } from "../dto/users.js";
import type { PaginatedResponse } from "../dto/response.js";
import type { User } from "../generated/prisma/client.js";
import type { UserCreateInput, UserTokenCreateInput, UserUpdateInput } from "../generated/prisma/models.js";
import type { IUsersRepository, UserWithRoleAndToken } from "../repositories/users_repository.interface.js";
import { AppError, handlePrismaError } from "../utils/error.js";
import { generateActivationToken } from "../utils/token.js";
import { buildActivationUrl, resolveFileUrl } from "../utils/url.js";
import type { IUsersService } from "./users_service.interface.js";
import bcrypt from 'bcrypt';
import type { IRedisClient } from "../database/redis.interface.js";

export class UsersService implements IUsersService {
    private usersRepo: IUsersRepository;
    private redis: IRedisClient;

    constructor(usersRepo: IUsersRepository, redis: IRedisClient) {
        this.usersRepo = usersRepo;
        this.redis = redis;
    }

    async getAll(page: number, limit: number, query: UserSearchQuery): Promise<PaginatedResponse<User>> {
        try {
            const cacheKey = `users:all:page=${page}:limit=${limit}:query=${JSON.stringify(query)}`;

            const cachedData = await this.redis.get(cacheKey);
            if (cachedData) {
                return JSON.parse(cachedData);
            }

            const users = await this.usersRepo.getAll(page, limit, query);
            if (users && users.items) {
                users.items = users.items.map(user => {
                    if (user.profile_picture) {
                        user.profile_picture = resolveFileUrl(user.profile_picture);
                    }
                    return user;
                });
            }

            if(users) {
                await this.redis.setEx(cacheKey, 300, JSON.stringify(users))
            }

            return users;
        } catch (err) {
            handlePrismaError(err)
        }
    }

    async getByID(userId: string): Promise<UserWithRoleAndToken | null> {
        try {
            const user = await this.usersRepo.getByID(userId);
            if (!user) return null;

            if (user.profile_picture) {
                user.profile_picture = resolveFileUrl(user.profile_picture);
            }

            return user;
        } catch (err) {
            handlePrismaError(err)
        }
    }

    async getProfile(userId: string): Promise<UserProfileResponse> {
        try {
            const user = await this.usersRepo.getUserWithRoleById(userId);
            if (!user) {
                throw new AppError("User tidak ditemukan", 404);
            }

            const totalLaporan = await this.usersRepo.countLaporanByUserId(userId);

            return {
                id: user.id,
                nama_lengkap: user.nama_lengkap,
                username: user.username,
                email: user.email,
                role: user.role.nama_role,
                profile_picture: resolveFileUrl(user.profile_picture),
                total_laporan: totalLaporan || 0
            };
        } catch (err) {
            throw handlePrismaError(err);
        }
    }

    async getByRole(nama_role: string): Promise<User[]> {
        try {
            return await this.usersRepo.getByRole(nama_role);
        } catch (err) {
            handlePrismaError(err);
        }
    }

    async create(req: CreateUserReq): Promise<CreateUserRes> {
        try {
            const activationToken = generateActivationToken(1);

            const userReq: UserCreateInput = {
                role: {
                    connect: { id: req.role_id }
                },
                username: req.username,
                email: req.email,
                nama_lengkap: req.nama_lengkap,
            }

            const createdUser = await this.usersRepo.insert(userReq);

            const activationUserReq: UserTokenCreateInput = {
                user: {
                    connect: { id: createdUser.id }
                },
                token_hash: activationToken.tokenHash,
                type: "activation",
                expired_at: activationToken.expiredAt,
            }

            await this.usersRepo.insertActivationToken(activationUserReq);
            const activationUrl = buildActivationUrl(activationToken.token);

            const res: CreateUserRes = {
                activationUrl
            }

            return res;
        } catch (err) {
            handlePrismaError(err)
        }
    }

    async update(userId: string, req: UpdateUserReq | UpdateProfileReq): Promise<void> {
        try {
            const userReq: UserUpdateInput = {}

            if ("username" in req && req.username !== undefined) userReq.username = req.username;
            if (req.nama_lengkap !== undefined) userReq.nama_lengkap = req.nama_lengkap;
            if ("email" in req && req.email !== undefined) userReq.email = req.email;
            if ("password" in req && req.password !== undefined) userReq.password = await bcrypt.hash(req.password, 16);
            if (req.profile_picture !== undefined) userReq.profile_picture = req.profile_picture;
            if ("role_id" in req && req.role_id !== undefined) {
                userReq.role = {
                    connect: { id: req.role_id }
                };
            }

            await this.usersRepo.update(userId, userReq);
        } catch (err) {
            handlePrismaError(err)
        }
    }

    async delete(userId: string): Promise<void> {
        try {
            await this.usersRepo.delete(userId);
        } catch (err) {
            handlePrismaError(err)
        }
    }

    async completeActivation(userId: string, password: string, tokenId: string): Promise<void> {
        try {
            const hashedPassword = await bcrypt.hash(password, 16);
            await this.usersRepo.update(userId, {
                password: hashedPassword,
                is_active: true,
            } as UserUpdateInput);
            await this.usersRepo.markTokenAsUsed(tokenId);
        } catch (err) {
            handlePrismaError(err);
        }
    }
}
