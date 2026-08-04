export interface ObHomeRes {
    ob: {
        nama_lengkap: string;
    };
    laporan: Array<{
        id: string;
        kategori: string;
        deskripsi_kendala: string;
        status: string;
        foto_masalah: string[];
        lokasi: string;
        nomor_lantai: number;
        priority: string;
        is_kolaborasi_open: boolean;
        created_at: string;
    }>;
}

export interface ObPerformance {
    total_tugas_selesai: number;
    rata_rata_kecepatan: number;
}
