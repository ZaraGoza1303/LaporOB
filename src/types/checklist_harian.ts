import type { Kategori, Lantai } from "../generated/prisma/client.js";
import type { PublicUser } from "./users.js";

export interface ChecklistHarianRes {
    id: string;
    nama_tugas: string;
    kategori_id: string;
    lantai_id: string;
    ob_id?: string | null;
    status: string;
    catatan?: string | null;
    dikerjakan_at?: Date | null;
    selesai_at?: Date | null;
    terlewat_at?: Date | null;
    total_durasi?: number | null;
    tanggal: Date;
    created_at: Date;
    updated_at: Date;
    kategori?: Kategori;
    lantai?: Lantai;
    ob?: PublicUser | null;
}
