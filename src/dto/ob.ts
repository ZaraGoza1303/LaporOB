import z, { refine } from "zod";

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

export const UpdateLaporanSchema = z.object({
    status: z.enum (["Sedang_Diprose", "Pending", "Selesai", "Ditolak"]),
    keterangan: z.string().optional(),
    foto: z.string().optional(),
}).refine((data) => {
    if (data.status === "Selesai" || data.status === "Ditolak"){
        return !!data.keterangan && data.keterangan.length >= 5 && !!data.foto;
    }
    return true;    
}, {
    message: "Keterangan (minimal 5 karakter) dan foto wajib ada diisi jika status Selesai/Tolak",
    path: ["keterangan"]
});

export type UpdateLaporanReq = z.infer<typeof UpdateLaporanSchema>; 

