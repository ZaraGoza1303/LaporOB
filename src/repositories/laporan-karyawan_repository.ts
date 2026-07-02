import { PrismaClient } from "../generated/prisma/index.js";
import type { ILaporanKaryawanRepository } from "./laporan-karyawan_repository.interface.js";
import type{ CreateLaporanReq } from "../dto/laporan.js";
import { STATUS_CODES } from "node:http";
import { includes } from "zod";

export class LaporanKaryawanRepository implements ILaporanKaryawanRepository{
    private db: PrismaClient;

    constructor(){
        this.db = new PrismaClient()
    }

    
    async create(pelapor_id: string, data: CreateLaporanReq){
        return await this.db.laporan_karyawan.create({
            data: {
                pelapor_id: pelapor_id,
                lantai_id: data.lantai_id,
                kategori_id: data.kategori_id,
                deskripsi_kendala: data.deskripsi_kendala,
                foto_masalah: data.foto_masalah,
                status: "Belum_Diproses"
            },
        });
    }

    
    async findAll(): Promise<any[]> {
        return await this.db.laporan_karyawan.findMany({
            include: {
                pelapor: { select: {nama_lengkap: true}},
                ob: {select: {nama_lengkap: true}},
                lantai: { include: {lokasi: true}},
                kategori: true,
            },
            orderBy: { created_at: "desc"},
        })
    }    

    async findByID(id: string): Promise<any | null> {
        return await this.db.laporan_karyawan.findFirst({
            where: { id },
            include: {
                pelapor: { select: {nama_lengkap: true}},
                ob: {select: {nama_lengkap: true}},
                lantai: { include: {lokasi: true}},
                kategori: true,
            },
        });
    }
    
    async updatestatus(laporanId: string, obId: string, statusBaru: string): Promise<any> {
        return await this.db.laporan_karyawan.update({
            where: {id: laporanId},
            data:{
                status: statusBaru,
                ob_id: obId,
            },
        });
    }

}