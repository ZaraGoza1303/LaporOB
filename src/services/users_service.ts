import type { UserSearchQuery } from "../dto/admin.js";
import type { CreateUserReq, CreateUserRes, UpdateProfileReq, UpdateUserReq } from "../dto/users.js";
import type { PaginatedResponse } from "../dto/response.js";
import type { User } from "../generated/prisma/client.js";
import type { UserCreateInput, UserTokenCreateInput, UserUpdateInput } from "../generated/prisma/models.js";
import type { IUsersRepository } from "../repositories/users_repository.interface.js";
import { handlePrismaError } from "../utils/error.js";
import { generateActivationToken } from "../utils/token.js";
import { buildActivationUrl, resolveFileUrl } from "../utils/url.js";
import type { IUsersService } from "./users_service.interface.js";
import bcrypt from 'bcrypt';

export class UsersService implements IUsersService {
    private usersRepo: IUsersRepository;

    constructor(usersRepo: IUsersRepository) {
        this.usersRepo = usersRepo;
    }

    async getAll(page: number, limit: number, query: UserSearchQuery): Promise<PaginatedResponse<User>> {
        try {
            const users = await this.usersRepo.getAll(page, limit, query);
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

    async getByID(userId: string): Promise<any | null> {
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

    async getProfile(userId: string): Promise<{
        id: string;
        nama_lengkap: string;
        username: string;
        email: string;
        role: string;
        profile_picture: string | null;
        total_laporan: number;
    }> {
        try {
            const user = await this.usersRepo.getUserWithRoleById(userId);
            if (!user) {
                throw new Error("User tidak ditemukan");
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

            await this.usersRepo.update(userId, userReq as any);
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
}
