import type { PaginatedResponse } from "../dto/response.js";
import type { CreateUserReq, CreateUserRes, UpdateUserReq } from "../dto/users.js";
import type { User } from "../generated/prisma/client.js";
import type { UserCreateInput, UserTokenCreateInput, UserUpdateInput } from "../generated/prisma/models.js";
import type { IUsersRepository } from "../repositories/users_repository.interface.js";
import { handlePrismaError } from "../utils/error.js";
import { generateActivationToken } from "../utils/token.js";
import { buildActivationUrl, resolveFileUrl } from "../utils/url.js";
import type { IUsersService } from "./users_service.interface.js";
import { StorageServiceFactory } from "./storage_service.factory.js";
import bcrypt from 'bcrypt';

export class UsersService implements IUsersService {
    private usersRepo: IUsersRepository;
    private storageService = StorageServiceFactory.getProvider();

    constructor(usersRepo: IUsersRepository) {
        this.usersRepo = usersRepo
    }

    async getAll(page: number, limit: number, search?: string | null): Promise<PaginatedResponse<User>> {
        try {
            const users = await this.usersRepo.getAll(page, limit, search);
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
            const user = await this.usersRepo.getByID(userId);
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

    async update(userId: string, req: UpdateUserReq, file?: Express.Multer.File): Promise<void> {
        try {
            const userReq: UserUpdateInput = {}

            if (file) {
                const oldUser = await this.usersRepo.getByID(userId);
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
}