import type { PaginatedResponse } from "../dto/response.js";
import type { UserActivityRes } from "../dto/users.js";
import type { PrismaClient, User, Prisma } from "../generated/prisma/client.js";
import type { Laporan_karyawanCreateInput, UserCreateInput, UserTokenCreateInput } from "../generated/prisma/models.js";
import type { IUsersRepository, ProfileUser, ProfileReport, DetailReportPayload } from "./users_repository.interface.js";

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

    async getActivity(userId: string): Promise<UserActivityRes[]> {
        const data = await this.db.laporan_karyawan.findMany({
            where: {
                pelapor_id: userId
            },
            include: {
                lantai: {
                    include: {
                        lokasi: true
                    }
                },
                kategori: true
            },
            orderBy : {
                created_at: 'desc'
            },
            take: 2
        });

        return data;
    }

    async insertActivationToken(activationToken: UserTokenCreateInput): Promise<void> {
        await this.db.userToken.create({
            data: activationToken
        })
    }

    async insertReport(req: Laporan_karyawanCreateInput): Promise<void> {
        await this.db.laporan_karyawan.create({ 
            data: req
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

    async getUserWithRoleById(userId: string): Promise<ProfileUser | null> {
        return this.db.user.findFirst({
            where: {
                id: userId,
                is_deleted: false
            },
            include: {
                role: true
            }
        });
    }

    async getReportsByUserId(userId: string, limit: number, cursor?: string | null, search?: string | null, status?: string | null): Promise<PaginatedResponse<ProfileReport>> {
        const whereCondition = this.buildWhereClause({ pelapor_id: userId }, search, status);
        return this.executePaginatedReports(whereCondition, limit, cursor);
    }

    async getReportsByObId(obId: string, limit: number, cursor?: string | null, search?: string | null, status?: string | null): Promise<PaginatedResponse<ProfileReport>> {
        const whereCondition = this.buildWhereClause({ ob_id: obId }, search, status);
        return this.executePaginatedReports(whereCondition, limit, cursor);
    }

    async getReportDetailById(reportId: string): Promise<DetailReportPayload | null> {
        return this.db.laporan_karyawan.findUnique({
            where: {
                id: reportId
            },
            include: {
                kategori: true,
                lantai: {
                    include: {
                        lokasi: true
                    }
                },
                ob: true,
                pelapor: true
            }
        });
    }

    private async executePaginatedReports(whereCondition: Prisma.Laporan_karyawanWhereInput, limit: number, cursor?: string | null): Promise<PaginatedResponse<ProfileReport>> {
        const [reports, total] = await Promise.all([
            this.db.laporan_karyawan.findMany({
                where: whereCondition,
                take: limit + 1,
                ...((cursor) && {
                    skip: 1,
                    cursor: { id: cursor }
                }),
                include: {
                    kategori: true,
                    lantai: { include: { lokasi: true } },
                    ob: true
                },
                orderBy: [
                    { created_at: "desc" },
                    { id: "desc" }
                ]
            }),
            this.db.laporan_karyawan.count({ where: whereCondition })
        ]);

        const hasNextPage = reports.length > limit;
        const items = hasNextPage ? reports.slice(0, limit) : reports;
        const nextCursor = hasNextPage ? (items[items.length - 1]?.id ?? null) : null;

        return {
            items: items as unknown as ProfileReport[],
            next_cursor: nextCursor,
            meta: {
                total_items: total,
                current_page: 1,
                limit,
                total_pages: Math.ceil(total / limit)
            }
        };
    }

    private buildWhereClause(baseFilter: Prisma.Laporan_karyawanWhereInput, search?: string | null, status?: string | null): Prisma.Laporan_karyawanWhereInput {
        const where: Prisma.Laporan_karyawanWhereInput = { ...baseFilter };

        if (search) {
            where.OR = [
                { deskripsi_kendala: { contains: search, mode: "insensitive" as const } },
                { kategori: { nama_kategori: { contains: search, mode: "insensitive" as const } } },
                { lantai: { lokasi: { nama_lokasi: { contains: search, mode: "insensitive" as const } } } }
            ];
        }

        if (status) {
            where.status = { equals: status, mode: "insensitive" as const };
        }

        return where;
    }
}