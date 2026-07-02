import { error } from "node:console";
import type { CreateLaporanReq } from "../dto/laporan.js";
import type { ILaporanKaryawanRepository } from "../repositories/laporan-karyawan_repository.interface.js";
import type { ILaporanKaryawanService } from "./laporan_karyawan.interface.js";

export class LaporanKaryawanService implements ILaporanKaryawanService{
    private laporanRepo: ILaporanKaryawanRepository;

    constructor(laporanRepo: ILaporanKaryawanRepository){
        this.laporanRepo = laporanRepo;
    }

    async createLaporan(pelapor_id: string, data: CreateLaporanReq): Promise<any> {
        return await this.laporanRepo.create(pelapor_id, data);
    }
    
    async getAllLaporan(): Promise<any> {
        return await this.laporanRepo.findAll();
    }

    async getDetailLaporan(id: string): Promise<any> {
    const laporanExisting = await this.laporanRepo.findByID(id);
        if (!laporanExisting) {
            throw new Error("Laporan tidak ditemukan");
        }
        return laporanExisting;
    }

    async updateStatusLaporan(laporanId: string, obId: string, statusBaru: string): Promise<any> {
        const laporanExisting = await this.laporanRepo.findByID(laporanId);{
            if (!laporanExisting) {
                throw new Error ("laporan tidak ditemukan ");
            }

            if (laporanExisting.status === "Selesai") {
                throw new Error (" Pekerjaan ini sudah dikerjakan");
            }

            const statusValid = ["Sedang_Diproses", "Pending", "Selesai"];
            if (!statusValid.includes(statusBaru)){
                throw new Error(" Status Aksi yang dikirim tidak sah");
            }
            return await this.laporanRepo.updatestatus(laporanId, obId, statusBaru)
        }
    }

}
