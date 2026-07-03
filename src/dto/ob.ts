export interface ObDashboardRes {
    ob: {
        id: string;
        nama_lengkap: string;
        username: string;
        email: string;
        profile_picture: string | null;
    };
    tugas_harian_stats: {
        total: number;
        resolved: number;
        pending: number;
    };
    tugas_harian: Array<{
        id: string;
        nama_tugas: string;
        kategori: string;
        lokasi: string;
        nomor_lantai: number;
        status: string;
        tanggal: string;
    }>;
    laporan: Array<{
        id: string;
        kategori: string;
        deskripsi_kendala: string;
        status: string;
        foto_masalah: string | null;
        lokasi: string;
        nomor_lantai: number;
        priority: string;
        created_at: string;
    }>;
}
