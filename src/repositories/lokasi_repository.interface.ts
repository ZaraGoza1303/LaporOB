import type { CreateLokasiReq, UpdateLokasiReq } from "../dto/lokasi.js";
import type { LokasiWithLantai } from "../types/lokasi.js";

export interface ILokasiRepository {
    getAll(): Promise<LokasiWithLantai[]>;
    getByID(lokasiId: string): Promise<LokasiWithLantai | null>;
    insert(req: CreateLokasiReq): Promise<string>;
    update(lokasiId: string, req: UpdateLokasiReq): Promise<void>;
    delete(lokasiId: string): Promise<void>;
}
