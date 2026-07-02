import { create } from "node:domain";
import type { CreateLaporanReq } from "../dto/laporan.js";
import { string } from "zod";

    export interface ILaporanKaryawanRepository{
        create(pelapor_id: string, data: CreateLaporanReq): Promise<any>
        findAll(): Promise<any[]>;
        findByID(id: string): Promise<any | null>;
        updatestatus(laporanId: string, obId: string, statusBaru: string): Promise<any>;
    }
