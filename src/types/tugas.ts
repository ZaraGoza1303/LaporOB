export interface TugasDetailRes {
    id: string;
    nama_tugas: string;
    kategori: { id: string; nama_kategori: string } | null;
    lantai: { id: string; nomor_lantai: number; lokasi: { id: string; nama_lokasi: string } } | null;
    ob: { id: string; nama_lengkap: string } | null;
    status: string;
    catatan: string | null;
    dikerjakan_at: Date | null;
    selesai_at: Date | null;
    total_durasi: number | null;
    hari: string[];
    is_approved: boolean;
    approved_at: Date | null;
    created_at: Date;
    updated_at: Date;
}
