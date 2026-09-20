import type { NotifikasiWithPengirim } from "../repositories/notification_repository.interface.js";

export interface NotificationData {
    penerima_id: string;
    pengirim_id: string | null;
    tipe: string;
    judul: string;
    pesan?: string;
    ref_id?: string | null;
    ref_tipe?: string | null;
}

export interface BulkNotificationData {
    penerima_ids: string[];
    pengirim_id: string | null;
    tipe: string;
    judul: string;
    pesan?: string;
    ref_id?: string | null;
    ref_tipe?: string | null;
}

export interface NotifikasiGroupedResponse {
    hari_ini: NotifikasiWithPengirim[];
    kemarin: NotifikasiWithPengirim[];
}
