import type { PaginatedResponse } from "../dto/response.js";
import type { PrismaClient, User } from "../generated/prisma/client.js";
import type { UserCreateInput, UserTokenCreateInput } from "../generated/prisma/models.js";
import type { IUsersRepository } from "./users_repository.interface.js";

export class UsersRepository implements IUsersRepository {
    private db: PrismaClient;

    constructor(db: PrismaClient){
        this.db = db
    }

    async getAll(page: number, limit: number, search?: string | null): Promise<PaginatedResponse<User>> {
        const offset = (page - 1) * limit;
        const search_filter: any = search ? {
            OR: [
            { username: { contains: search, mode: 'insensitive' } },
            { nama_lengkap: { contains: search, mode: 'insensitive' } },
            ]
        } : {};

        const[users, total_users] = await Promise.all([
            this.db.user.findMany({
                where: {
                    ...search_filter,
                },
                skip: offset,
                take: limit,
                orderBy: {username: 'asc'}
            }),
            this.db.user.count({
                where: {
                    ...search_filter,
                }
            })
        ])

        const res: PaginatedResponse<User> = {
            items: users,
            next_cursor: null,
            meta: {
                total_items: total_users,
                current_page: page,
                limit,
                total_pages: Math.ceil(total_users / limit)
            }
        }

        return res
    }

    async getByID(userId: string): Promise<User | null> {
        const user = await this.db.user.findFirst({
            where: {
                id: userId
            }
        })

        return user
    }

    async insert(req: UserCreateInput): Promise<User> {
        const user = await this.db.user.create({
            data: req,
        });
        return user;
    }
    
    async update(userId: string, req: User): Promise<void> {
        await this.db.user.update({
            where: {
                id: userId,
            },
            data: req
        })
    }

    async delete(userId: string): Promise<void> {
        await this.db.user.update({
            where: {
                id: userId
            }, 
            data: {
                is_deleted: true
            }
        })
    }

    async insertActivationToken(activationToken: UserTokenCreateInput): Promise<void> {
        await this.db.userToken.create({
            data: activationToken
        })
    }

    async markTokenAsUsed(tokenId: string): Promise<void> {
        await this.db.userToken.update({
            where: {
                id: tokenId
            },
            data: {
                used_at: new Date(),
            }
        })
    }
    
}