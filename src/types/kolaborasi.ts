export interface GabungResponse {
    id: string;
    laporan_id: string;
    ob_id: string;
    status: string;
    created_at: string;
}

export interface DaftarGabungItem {
    id: string;
    ob: {
        id: string;
        nama_lengkap: string;
    };
    status: string;
    created_at: string;
}

export type KolaborasiStatus = "PENDING" | "APPROVED" | "REJECTED";
