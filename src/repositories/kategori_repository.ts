import type { IKategoriRepository } from "../repositories/kategori_repository.interface.js";
import type { CreateCategoryReq, UpdateCategoryReq } from "../dto/kategori.js";
import type { PrismaClient, Kategori } from "../generated/prisma/client.js"; 
import type { PaginatedResponse } from "../dto/response.js"; 

export class KategoriRepository implements IKategoriRepository {
    private db: PrismaClient;

    constructor(db: PrismaClient) {
        this.db = db;
    }

    async getAll(page: number, limit: number, search?: string | null): Promise<PaginatedResponse<Kategori>> {
        const skip = (page - 1) * limit;
        
        const whereCondition = search 
            ? { nama_kategori: { contains: search, mode: 'insensitive' as const } }
            : {};
            
        const [data, total] = await Promise.all([
            this.db.kategori.findMany({
                where: whereCondition,
                skip: skip,
                take: limit,
                orderBy: { id: 'desc' } 
            }),
            this.db.kategori.count({ where: whereCondition })
        ]);

        return {
            items: data,
            next_cursor: null,
            meta: {
                total_items: total,
                current_page: page,
                limit,
                total_pages: Math.ceil(total / limit)
            }
        };
    }

  async getById(id: string | number): Promise<Kategori | null> {

    const prismaId = String(id); 

    return await this.db.kategori.findUnique({
        where: { id: prismaId }
    });
}

    async create(data: CreateCategoryReq): Promise<Kategori> {

        return await this.db.kategori.create({
            data: {
                nama_kategori: data.nama_kategori
            }
        });
    }

    async update(id: string | number, data: UpdateCategoryReq): Promise<Kategori | null> {

    const prismaId = String(id); 

    return await this.db.kategori.update({
        where: { id: prismaId },
        data: {
            nama_kategori: data.nama_kategori
        }
    });
}
}