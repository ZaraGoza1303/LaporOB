import type { UserSearchQuery, UserStatsRes } from "../dto/admin.js";
import type { PaginatedResponse } from "../dto/response.js";
import { Prisma, type PrismaClient, type User } from "../generated/prisma/client.js";
import type { UserCreateInput, UserTokenCreateInput, UserUpdateInput } from "../generated/prisma/models.js";
import type { IAdminRepository } from "./admin_repository.interface.js";

export class AdminRepository implements IAdminRepository {
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

        return {
            items: users,
            next_cursor: null,
            meta: {
                total_items: total_users,
                current_page: page,
                limit,
                total_pages: Math.ceil(total_users / limit)
            }
        }
    }

    async getByID(userId: string): Promise<any | null> {
        return this.db.user.findFirst({
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
        })
    }

    async insert(req: UserCreateInput): Promise<User> {
        return this.db.user.create({ data: req });
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

    async getUserStats(): Promise<UserStatsRes> {
        const notDeleted = { is_deleted: false };

        const [totalUsers, totalActiveUsers, totalNonActiveUsers, roleOb] = await Promise.all([
            this.db.user.count({ where: notDeleted }),
            this.db.user.count({ where: { ...notDeleted, is_active: true } }),
            this.db.user.count({ where: { ...notDeleted, is_active: false } }),
            this.db.role.findFirst({ where: { nama_role: 'ob' } })
        ]);

        let totalOb = 0;
        if (roleOb) {
            totalOb = await this.db.user.count({
                where: {
                    role_id: roleOb.id,
                    is_deleted: false,
                }
            });
        }

        const res: UserStatsRes = {
            totalUsers,
            activeUsers: totalActiveUsers,
            nonActiveUsers: totalNonActiveUsers,
            totalOB: totalOb,
        }

        return res;
    }
}
