import type { UserSearchQuery } from "../dto/admin.js";
import type { CreateUserReq, UpdateProfileReq, UpdateUserReq, UserProfileResponse } from "../dto/users.js";
import type { PaginatedResponse } from "../dto/response.js";
import type { User, Role } from "../generated/prisma/client.js";
import type { UserTokenCreateInput, UserUpdateInput } from "../generated/prisma/models.js";
import type { IUsersRepository, UserWithRoleAndToken } from "../repositories/users_repository.interface.js";
import { AppError, handlePrismaError } from "../utils/error.js";
import { generateActivationToken } from "../utils/token.js";
import { buildActivationUrl, resolveFileUrl } from "../utils/url.js";
import type { IUsersService } from "./users_service.interface.js";
import bcrypt from 'bcrypt';
import type { IRedisClient } from "../database/redis.interface.js";
import type { IEmailService } from "./email_service.interface.js";
import { sendRenderedEmail } from "../utils/email.js";

export class UsersService implements IUsersService {
    private usersRepo: IUsersRepository;
    private redis: IRedisClient;
    private emailService: IEmailService;

    constructor(usersRepo: IUsersRepository, redis: IRedisClient, emailService: IEmailService) {
        this.usersRepo = usersRepo;
        this.redis = redis;
        this.emailService = emailService;
    }

    async getAll(page: number, limit: number, query: UserSearchQuery): Promise<PaginatedResponse<User>> {
        try {
            const cacheKey = `users:all:page=${page}:limit=${limit}:query=${JSON.stringify(query)}`;

            const cachedData = await this.redis.get(cacheKey)
            if (cachedData) {
                const parsedData: PaginatedResponse<User> = JSON.parse(cachedData)
                return parsedData
            }

            const data = await this.usersRepo.getAll(page, limit, query);
            await this.redis.setEx(cacheKey, 300, JSON.stringify(data))
            return data;
        } catch (err) {
            throw handlePrismaError(err)
        }
    }

    async getByID(userId: string): Promise<UserWithRoleAndToken | null> {
        try {
            const user = await this.usersRepo.getByID(userId)
            if (!user) return null;

            return user;
        } catch (err) {
            throw handlePrismaError(err)
        }
    }

    async getByEmail(email: string): Promise<User | null> {
        try {
            const user = await this.usersRepo.getByEmail(email);
            return user;
        } catch (err) {
            throw handlePrismaError(err)
        }
    }

    async getProfile(userId: string): Promise<UserProfileResponse> {
        try {
            const user = await this.usersRepo.getUserWithRoleById(userId);
            if (!user) {
                throw new AppError("User tidak ditemukan", 404);
            }

            const profile: UserProfileResponse = {
                id: user.id,
                nama_lengkap: user.nama_lengkap,
                username: user.username,
                email: user.email,
                role: user.role.nama_role,
                profile_picture: resolveFileUrl(user.profile_picture),
            };
            return profile;
        } catch (err) {
            throw handlePrismaError(err);
        }
    }

    async getByRole(nama_role: string): Promise<User[]> {
        try {
            const users = await this.usersRepo.getByRole(nama_role);
            return users;
        } catch (err) {
            handlePrismaError(err);
        }
    }

    async create(req: CreateUserReq): Promise<void> {
        try {
            const activationToken = generateActivationToken(5);

            const createdUser = await this.usersRepo.transaction(async (tx) => {
                const user = await tx.user.create({
                    data: {
                        role: { connect: { id: req.role_id } },
                        username: req.username,
                        email: req.email,
                        nama_lengkap: req.nama_lengkap,
                    },
                });

                await tx.userToken.create({
                    data: {
                        user: { connect: { id: user.id } },
                        token_hash: activationToken.tokenHash,
                        type: "activation",
                        expired_at: activationToken.expiredAt,
                    },
                });

                return user;
            });

            const activationUrl = buildActivationUrl(activationToken.token);
            await sendRenderedEmail(this.emailService, req.email, "Aktivasi Akun", "activation", {
                userName: req.nama_lengkap,
                activationUrl,
            });

            await this.redis.del("users:all:*");
        } catch (err) {
            throw handlePrismaError(err);
        }
    }

    async update(userId: string, req: UpdateUserReq): Promise<void> {
        try {
            const updateData: UserUpdateInput = {};

            if (req.role_id) updateData.role = { connect: { id: req.role_id } };
            if (req.username) updateData.username = req.username;
            if (req.email) updateData.email = req.email;
            if (req.nama_lengkap) updateData.nama_lengkap = req.nama_lengkap;
            if (req.password) updateData.password = await bcrypt.hash(req.password, 10);
            if (req.profile_picture) updateData.profile_picture = req.profile_picture;
            if (req.is_active !== undefined) updateData.is_active = req.is_active;
            if (req.is_active === false) updateData.is_deleted = true;

            await this.usersRepo.update(userId, updateData);
            await this.redis.del("users:all:*");
        } catch (err) {
            throw handlePrismaError(err);
        }
    }

    async delete(userId: string): Promise<void> {
        try {
            await this.usersRepo.delete(userId);
            await this.redis.del("users:all:*");
        } catch (err) {
            throw handlePrismaError(err);
        }
    }

    async completeActivation(userId: string, password: string, tokenId: string): Promise<void> {
        try {
            const passwordHash = await bcrypt.hash(password, 10);
            await this.usersRepo.transaction(async (tx) => {
                await tx.user.update({
                    where: { id: userId },
                    data: {
                        is_active: true,
                        is_deleted: false,
                        password: passwordHash,
                    },
                });

                await tx.userToken.update({
                    where: { id: tokenId },
                    data: { used_at: new Date() },
                });
            });
        } catch (err) {
            throw handlePrismaError(err);
        }
    }

    async getRoles(): Promise<Role[]> {
        try {
            const roles = await this.usersRepo.getRoles();
            return roles
        } catch (err) {
            throw handlePrismaError(err)
        }
    }

    async renewActivationToken(userId: string): Promise<void> {
        try {
            const user = await this.usersRepo.getByID(userId);
            if (!user) {
                throw new AppError("User tidak ditemukan", 404);
            }

            const currentToken = user.tokens.find(t => t.type === "activation" && t.used_at === null);
            if (currentToken) {
                await this.usersRepo.markTokenAsUsed(currentToken.id);
            }

            const activationToken = generateActivationToken(5);

            await this.usersRepo.insertActivationToken({
                user: { connect: { id: userId } },
                token_hash: activationToken.tokenHash,
                type: "activation",
                expired_at: activationToken.expiredAt,
            });

            const activationUrl = buildActivationUrl(activationToken.token);
            await sendRenderedEmail(this.emailService, user.email, "Aktivasi Akun (Baru)", "activation", {
                user: { nama_lengkap: user.nama_lengkap },
                activationUrl,
            });
        } catch (err) {
            throw handlePrismaError(err);
        }
    }

    async createPasswordResetToken(userId: string, tokenHash: string, expiredAt: Date): Promise<void> {
        await this.usersRepo.insertActivationToken({
            user: { connect: { id: userId } },
            token_hash: tokenHash,
            type: "password_reset",
            expired_at: expiredAt,
        });
    }

    async resetUserPassword(userId: string, passwordHash: string, tokenId?: string | null): Promise<void> {
        try {
            const updateData: UserUpdateInput = { password: passwordHash };

            await this.usersRepo.transaction(async (tx) => {
                await tx.user.update({
                    where: { id: userId },
                    data: updateData,
                });

                if (tokenId) {
                    await tx.userToken.update({
                        where: { id: tokenId },
                        data: { used_at: new Date() }
                    });
                }
            });
        } catch (err) {
            throw handlePrismaError(err);
        }
    }
}
