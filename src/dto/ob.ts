export interface ObHomeRes {
    ob: {
        nama_lengkap: string;
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

