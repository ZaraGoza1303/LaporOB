// dto/profile.ts
import type { PaginatedResponse } from "./response.js";

export interface MappedProfileReport {
    id: string;
    kode_laporan: string;
    kategori: string;
    deskripsi_kendala: string;
    status: string;
    prioritas: string;
    foto_masalah: string | null;
    lokasi: string;
    nomor_lantai: number;
    nama_ob: string | null;
    created_at: string;
    updated_at: string;
}

export interface ProfileRes {
    user: {
        id: string;
        nama_lengkap: string;
        username: string;
        email: string;
        role: string;
        profile_picture: string | null;
    };
    laporan: PaginatedResponse<MappedProfileReport>; // <-- Pakai PaginatedResponse di sini
}