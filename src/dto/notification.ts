import z from "zod";
import type { NotifikasiWithPengirim } from "../repositories/notification_repository.interface.js";

export interface NotificationData {
    penerima_id: string;
    pengirim_id: string;
    tipe: string;
    judul: string;
    pesan?: string;
}

export interface BulkNotificationData {
    penerima_ids: string[];
    pengirim_id: string;
    tipe: string;
    judul: string;
    pesan?: string;
}

export interface NotifikasiGroupedResponse {
    hari_ini: NotifikasiWithPengirim[];
    kemarin: NotifikasiWithPengirim[];
}

export const NotificationIdSchema = z.object({
  notification_id: z.string().trim().uuid({ message: "Format laporan_id harus UUID yang valid" }),
});
