import type { PrismaClient } from "../generated/prisma/client.js";
import type { ILokasiRepository } from "./lokasi_repository.interface.js";
import type { LokasiWithLantai, CreateLokasiReq, UpdateLokasiReq } from "../dto/lokasi.js";

export class LokasiRepository implements ILokasiRepository {
    private db: PrismaClient;

    constructor(db: PrismaClient) {
        this.db = db;
    }

    async getAll(): Promise<LokasiWithLantai[]> {
        return this.db.lokasi.findMany({
            include: {
                lantai: {
                    orderBy: {
                        nomor_lantai: 'asc'
                    }
                }
            },
            orderBy: {
                created_at: 'desc'
            }
        });
    }

    async getByID(lokasiId: string): Promise<LokasiWithLantai | null> {
        return this.db.lokasi.findFirst({
            where: {
                id: lokasiId
            },
            include: {
                lantai: {
                    orderBy: {
                        nomor_lantai: 'asc'
                    }
                }
            }
        });
    }

    async insert(req: CreateLokasiReq): Promise<void> {
        await this.db.$transaction(async (tx) => {
            const lokasi = await tx.lokasi.create({
                data: {
                    nama_lokasi: req.nama_lokasi
                }
            });

            const lantaiData = Array.from({ length: req.jumlah_lantai }, (_, i) => ({
                lokasi_id: lokasi.id,
                nomor_lantai: i + 1
            }));

            await tx.lantai.createMany({
                data: lantaiData
            });
        });
    }

    async update(lokasiId: string, req: UpdateLokasiReq): Promise<void> {
        await this.db.$transaction(async (tx) => {
            if (req.nama_lokasi) {
                await tx.lokasi.update({
                    where: { id: lokasiId },
                    data: { nama_lokasi: req.nama_lokasi }
                });
            }

            if (req.jumlah_lantai !== undefined) {
                const existingLantai = await tx.lantai.findMany({
                    where: { lokasi_id: lokasiId },
                    orderBy: { nomor_lantai: 'asc' }
                });

                const currentCount = existingLantai.length;
                const newCount = req.jumlah_lantai;

                if (newCount > currentCount) {
                    const lastFloor = currentCount > 0 ? existingLantai[currentCount - 1] : undefined;
                    const startNum = lastFloor ? lastFloor.nomor_lantai + 1 : 1;
                    const lantaiData = [];
                    for (let i = startNum; i <= newCount; i++) {
                        lantaiData.push({
                            lokasi_id: lokasiId,
                            nomor_lantai: i
                        });
                    }
                    if (lantaiData.length > 0) {
                        await tx.lantai.createMany({
                            data: lantaiData
                        });
                    }
                } else if (newCount < currentCount) {
                    await tx.lantai.deleteMany({
                        where: {
                            lokasi_id: lokasiId,
                            nomor_lantai: {
                                gt: newCount
                            }
                        }
                    });
                }
            }
        });
    }

    async delete(lokasiId: string): Promise<void> {
        await this.db.$transaction(async (tx) => {
            await tx.lantai.deleteMany({
                where: {
                    lokasi_id: lokasiId
                }
            });

            await tx.lokasi.delete({
                where: {
                    id: lokasiId
                }
            });
        });
    }
}
