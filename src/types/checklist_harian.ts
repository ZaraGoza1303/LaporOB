import type { Kategori, Lantai, Lokasi, User } from "../generated/prisma/client.js";

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
    is_approved: boolean;
    approved_at?: Date | null;
    tanggal: Date;
    created_at: Date;
    updated_at: Date;
    kategori?: Kategori | null;
    lantai?: (Lantai & { lokasi?: Lokasi | null }) | null;
    ob?: User | null;
}
