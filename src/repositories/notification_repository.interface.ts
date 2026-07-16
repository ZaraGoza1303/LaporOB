import type { PaginatedResponse } from "../dto/response.js";
import type { Notifikasi } from "../generated/prisma/client.js";
import type { NotifikasiCreateInput } from "../generated/prisma/models.js";

export interface NotifikasiWithPengirim {
    id: string;
    penerima_id: string;
    pengirim_id: string;
    tipe: string;
    judul: string;
    pesan: string | null;
    is_read: boolean;
    read_at: Date | null;
    ref_id: string | null;
    ref_tipe: string | null;
    created_at: Date;
    pengirim: {
        id: string;
        nama_lengkap: string;
    };
}

export interface INotificationRepository {
    insert(req: NotifikasiCreateInput): Promise<Notifikasi>
    insertMany(reqs: NotifikasiCreateInput[]): Promise<Notifikasi[]>
    markAsRead(notifId: string): Promise<void>
    markAllAsRead(userId: string): Promise<void>
    countUnread(userId: string): Promise<number>
    getAllByUserId(userId: string, limit: number, cursor?: string | null): Promise<PaginatedResponse<NotifikasiWithPengirim>>
    getAllByDateRange(startDate: Date, endDate: Date): Promise<NotifikasiWithPengirim[]>;
    getByTypesAndDateRange(types: string[], startDate: Date, endDate: Date): Promise<NotifikasiWithPengirim[]>;
    getByUserAndDateRange(userId: string, startDate: Date, endDate: Date): Promise<NotifikasiWithPengirim[]>
}
