import type { CreateLokasiReq, UpdateLokasiReq } from "../dto/lokasi.js";
import type { LokasiRes } from "../types/lokasi.js";

export interface ILokasiService {
    getAll(): Promise<LokasiRes[]>;
    getByID(lokasiId: string): Promise<LokasiRes | null>;
    create(req: CreateLokasiReq): Promise<void>;
    update(lokasiId: string, req: UpdateLokasiReq): Promise<void>;
    delete(lokasiId: string): Promise<void>;
}
