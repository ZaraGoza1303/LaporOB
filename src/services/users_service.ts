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

            const cachedData = await this.redis.get(cacheKey);
            if (cachedData) {
                const parsedData = JSON.parse(cachedData);
                return parsedData;
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

    async getByEmail(email: string): Promise<User | null> {
        try {
            const user = await this.usersRepo.getByEmail(email);
            return user;
        } catch (err) {
            handlePrismaError(err);
        }
    }

    async getProfile(userId: string): Promise<UserProfileResponse> {
        try {
            const user = await this.usersRepo.getUserWithRoleById(userId);
            if (!user) {
                throw new AppError("User tidak ditemukan", 404);
            }

            const totalLaporan = await this.usersRepo.countLaporanByUserId(userId);

            const profile: UserProfileResponse = {
                id: user.id,
                nama_lengkap: user.nama_lengkap,
                username: user.username,
                email: user.email,
                role: user.role.nama_role,
                profile_picture: resolveFileUrl(user.profile_picture),
                total_laporan: totalLaporan || 0
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
            await sendRenderedEmail(this.emailService, createdUser.email, "Aktivasi Akun LaporOB", "activation", {
                userName: createdUser.username,
                activationUrl: activationUrl,
                expiresInHours: 5,
            });

        } catch (err) {
            handlePrismaError(err);
        }
    }

    async update(userId: string, req: UpdateUserReq): Promise<void> {
        try {
            const userReq: UserUpdateInput = {}

            if (req.username !== undefined) userReq.username = req.username;
            if (req.nama_lengkap !== undefined) userReq.nama_lengkap = req.nama_lengkap;
            if (req.email !== undefined) userReq.email = req.email;
            if (req.password !== undefined) userReq.password = await bcrypt.hash(req.password, 16);
            if (req.profile_picture !== undefined) userReq.profile_picture = req.profile_picture;
            if (req.role_id !== undefined) {
                userReq.role = {
                    connect: { id: req.role_id }
                };
            }
            if (req.is_active !== undefined) {
                userReq.is_active = req.is_active;
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

    async getRoles(): Promise<Role[]> {
        try {
            const roles = await this.usersRepo.getRoles();
            return roles;
        } catch (err) {
            handlePrismaError(err);
        }
    }

    async renewActivationToken(userId: string): Promise<void> {
        try {
            const existsUser = await this.getByID(userId);
            if (!existsUser) {
                throw new AppError("User tidak ditemukan", 404);
            }

            if (existsUser.password) {
                throw new AppError("Akun sudah diaktivasi", 400);
            }

            const activationToken = generateActivationToken(5);
            await this.usersRepo.insertActivationToken({
                user: { connect: { id: userId } },
                token_hash: activationToken.tokenHash,
                type: "activation",
                expired_at: activationToken.expiredAt,
            })

            const activationUrl = buildActivationUrl(activationToken.token);
            await sendRenderedEmail(this.emailService, existsUser.email, "Aktivasi Akun LaporOB", "activation", {
                userName: existsUser.username,
                activationUrl: activationUrl,
                expiresInHours: 24,
            });
        } catch (err) {
            handlePrismaError(err);
        }
    }


    async createPasswordResetToken(userId: string, tokenHash: string, expiredAt: Date): Promise<void> {
        try {
            await this.usersRepo.insertActivationToken({
                token_hash: tokenHash,
                type: "reset_password",
                expired_at: expiredAt,
                user: { connect: { id: userId } }
            })
        } catch (err) {
            handlePrismaError(err);
        }
    }

    async resetUserPassword(userId: string, passwordHash: string, tokenId?: string | null): Promise<void> {
        try {
            await this.usersRepo.update(userId, {password: passwordHash})
            if (tokenId) {
                await this.usersRepo.markTokenAsUsed(tokenId);
            }
        } catch (err) {
            handlePrismaError(err);
        }
    }
}
