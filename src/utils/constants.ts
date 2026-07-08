export const CHECKLIST_STATUS = {
    BELUM_DIKERJAKAN: "BELUM_DIKERJAKAN",
    SEDANG_DIKERJAKAN: "SEDANG_DIKERJAKAN",
    SELESAI: "SELESAI",
    TERLEWAT: "TERLEWAT",
} as const;

export const LAPORAN_STATUS = {
    BELUM_DIKERJAKAN: "BELUM_DIKERJAKAN",
    PENDING: "PENDING",
    SELESAI: "SELESAI",
    DITOLAK: "DITOLAK",
} as const;

export const LAPORAN_PRIORITY = {
    URGENT: "URGENT",
    STANDARD: "STANDARD",
} as const;

export type LaporanStatus = typeof LAPORAN_STATUS[keyof typeof LAPORAN_STATUS];
export type LaporanPriority = typeof LAPORAN_PRIORITY[keyof typeof LAPORAN_PRIORITY];