import type { CreateLokasiReq, UpdateLokasiReq, LokasiRes } from "../dto/lokasi.js";
import type { ILokasiRepository } from "../repositories/lokasi_repository.interface.js";
import { handlePrismaError } from "../utils/error.js";
import type { ILokasiService } from "./lokasi_service.interface.js";

export class LokasiService implements ILokasiService {
    private lokasiRepo: ILokasiRepository;

    constructor(lokasiRepo: ILokasiRepository) {
        this.lokasiRepo = lokasiRepo;
    }

    async getAll(): Promise<LokasiRes[]> {
        try {
            const data = await this.lokasiRepo.getAll();
            return data.map((item) => ({
                id: item.id,
                nama_lokasi: item.nama_lokasi,
                jumlah_lantai: item.lantai ? item.lantai.length : 0,
                lantai: (item.lantai || []).map((floor: any) => ({
                    id: floor.id,
                    nomor_lantai: floor.nomor_lantai
                })),
                created_at: item.created_at,
                updated_at: item.updated_at
            }));
        } catch (err) {
            handlePrismaError(err);
        }
    }

    async getByID(lokasiId: string): Promise<LokasiRes | null> {
        try {
            const item = await this.lokasiRepo.getByID(lokasiId);
            if (!item) return null;

            return {
                id: item.id,
                nama_lokasi: item.nama_lokasi,
                jumlah_lantai: item.lantai ? item.lantai.length : 0,
                lantai: (item.lantai || []).map((floor: any) => ({
                    id: floor.id,
                    nomor_lantai: floor.nomor_lantai
                })),
                created_at: item.created_at,
                updated_at: item.updated_at
            };
        } catch (err) {
            handlePrismaError(err);
        }
    }

    async create(req: CreateLokasiReq): Promise<void> {
        try {
            await this.lokasiRepo.insert({
                nama_lokasi: req.nama_lokasi,
                jumlah_lantai: req.jumlah_lantai
            });
        } catch (err) {
            handlePrismaError(err);
        }
    }

    async update(lokasiId: string, req: UpdateLokasiReq): Promise<void> {
        try {
            const updateParams: UpdateLokasiReq = {};
            if (req.nama_lokasi !== undefined) updateParams.nama_lokasi = req.nama_lokasi;
            if (req.jumlah_lantai !== undefined) updateParams.jumlah_lantai = req.jumlah_lantai;
            
            await this.lokasiRepo.update(lokasiId, updateParams);
        } catch (err) {
            handlePrismaError(err);
        }
    }

    async delete(lokasiId: string): Promise<void> {
        try {
            await this.lokasiRepo.delete(lokasiId);
        } catch (err) {
            handlePrismaError(err);
        }
    }
}
