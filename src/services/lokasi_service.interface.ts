import type { CreateLokasiReq, UpdateLokasiReq, LokasiRes } from "../dto/lokasi.js";

export interface ILokasiService {
    getAll(): Promise<LokasiRes[]>;
    getByID(lokasiId: string): Promise<LokasiRes | null>;
    create(req: CreateLokasiReq): Promise<void>;
    update(lokasiId: string, req: UpdateLokasiReq): Promise<void>;
    delete(lokasiId: string): Promise<void>;
}
