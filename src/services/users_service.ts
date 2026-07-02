import type { PaginatedResponse } from "../dto/response.js";
import type { CreateUserReq, UpdateUserReq } from "../dto/users.js";
import type { User } from "../generated/prisma/client.js";
import type { UserCreateInput, UserUpdateInput } from "../generated/prisma/models.js";
import type { IUsersRepository } from "../repositories/users_repository.interface.js";
import { handlePrismaError } from "../utils/error.js";
import type { IUsersService } from "./users_service.interface.js";
import bcrypt from 'bcrypt';

export class UsersService implements IUsersService {
    private usersRepo: IUsersRepository

    constructor(usersRepo: IUsersRepository){
        this.usersRepo = usersRepo
    }

    async getAll(page: number, limit: number, search?: string | null): Promise<PaginatedResponse<User>> {
        try {
            const users = await this.usersRepo.getAll(page, limit, search);
            return users;
        } catch (err) {
            handlePrismaError(err)
        }
    }

    async getByID(userId: string): Promise<User | null> {
        try {
            const user = await this.usersRepo.getByID(userId);
            return user;
        } catch(err) {
            handlePrismaError(err)
        }
    }

    async create(req: CreateUserReq): Promise<void> {
        try {
            const hashedPassword = await bcrypt.hash(req.password, 16);

            const userReq: UserCreateInput = {
                role: {
                    connect: {id: req.role_id}
                },
                username: req.username,
                password: hashedPassword,
                nama_lengkap: req.nama_lengkap,
            }

            await this.usersRepo.insert(userReq);
        } catch(err) {
            handlePrismaError(err)
        }
    }

    async update(userId: string, req: UpdateUserReq): Promise<void> {
        try {

            const userReq: UserUpdateInput = {}

            if(req.username !== undefined) userReq.username = req.username;
            if(req.nama_lengkap !== undefined) userReq.nama_lengkap = req.nama_lengkap;
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