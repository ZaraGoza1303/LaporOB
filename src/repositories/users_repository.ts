import type { UserSearchQuery } from "../dto/admin.js";
import type { PaginatedResponse } from "../dto/response.js";
import { Prisma, type PrismaClient, type User } from "../generated/prisma/client.js";
import type { UserCreateInput, UserTokenCreateInput, UserUpdateInput } from "../generated/prisma/models.js";
import type { IUsersRepository, ProfileUser, UserWithRoleAndToken } from "./users_repository.interface.js";

export class UsersRepository implements IUsersRepository {
    private db: PrismaClient;

    constructor(db: PrismaClient) {
        this.db = db
    }

    async getAll(page: number, limit: number, query: UserSearchQuery): Promise<PaginatedResponse<User>> {
        const { search, role_id } = query;
        const offset = (page - 1) * limit;

        const where: Prisma.UserWhereInput = {
            is_deleted: false,
        };

        if (search) {
            where.OR = [
                { username: { contains: search, mode: 'insensitive' } },
                { nama_lengkap: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (role_id) {
            where.role_id = role_id;
        }

        const [users, total_users] = await Promise.all([
            this.db.user.findMany({
                where,
                skip: offset,
                take: limit,
                orderBy: { username: 'asc' }
            }),
            this.db.user.count({
                where
            })
        ])

        const result: PaginatedResponse<User> = {
            items: users,
            next_cursor: null,
            meta: {
                total_items: total_users,
                current_page: page,
                limit,
                total_pages: Math.ceil(total_users / limit)
            }
        };
        return result
    }

    async getByID(userId: string): Promise<UserWithRoleAndToken | null> {
        const user = await this.db.user.findFirst({
            where: { id: userId },
            include: {
                role: true,
                tokens: {
                    orderBy: {
                        created_at: 'desc'
                    },
                    take: 1
                }
            }
        });
        return user;
    }

    async insert(req: UserCreateInput): Promise<User> {
        const user = await this.db.user.create({ data: req });
        return user;
    }

    async update(userId: string, req: UserUpdateInput): Promise<void> {
        await this.db.user.update({
            where: { id: userId },
            data: req
        })
    }

    async delete(userId: string): Promise<void> {
        await this.db.user.update({
            where: { id: userId },
            data: { is_deleted: true }
        })
    }

    async insertActivationToken(activationToken: UserTokenCreateInput): Promise<void> {
        await this.db.userToken.create({ data: activationToken })
    }

    async markTokenAsUsed(tokenId: string): Promise<void> {
        await this.db.userToken.update({
            where: { id: tokenId },
            data: { used_at: new Date() }
        })
    }

    async getUserWithRoleById(userId: string): Promise<ProfileUser | null> {
        const user = await this.db.user.findFirst({
            where: {
                id: userId,
                is_deleted: false
            },
            include: { role: true }
        });
        return user;
    }

    async getByRole(nama_role: string): Promise<User[]> {
        const users = await this.db.user.findMany({
            where: {
                is_deleted: false,
                is_active: true,
                role: {
                    nama_role: {
                        equals: nama_role,
                        mode: 'insensitive'
                    }
                }
            }
        });
        return users;
    }

   async countLaporanByUserId(userId: string): Promise<number> {
    const count = await this.db.laporan_karyawan.count({
        where: { pelapor_id: userId }
    });
    return count;
}
}
