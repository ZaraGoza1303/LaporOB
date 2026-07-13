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

export const NOTIFICATION_TYPE = {
    LAPORAN_BARU: "LAPORAN_BARU",
    LAPORAN_DIKERJAKAN: "LAPORAN_DIKERJAKAN",
    LAPORAN_BERES: "LAPORAN_BERES",
    LAPORAN_DITOLAK: "LAPORAN_DITOLAK",
    CHECKLIST_SELESAI: "CHECKLIST_SELESAI",
} as const;

export const NOTIFICATION_TITLE: Record<keyof typeof NOTIFICATION_TYPE, string> = {
    LAPORAN_BARU: "Laporan baru",
    LAPORAN_DIKERJAKAN: "Laporan sedang dikerjakan",
    LAPORAN_BERES: "Laporan selesai",
    LAPORAN_DITOLAK: "Laporan ditolak",
    CHECKLIST_SELESAI: "Checklist harian selesai",
} as const;

export const NOTIFICATION_MESSAGE = {
    LAPORAN_DIKERJAKAN: "Laporan anda sedang dikerjakan oleh OB",
    ADMIN_MENUGASKAN_OB: "Admin baru saja menugaskan anda",
} as const;

export type LaporanStatus = typeof LAPORAN_STATUS[keyof typeof LAPORAN_STATUS];
export type LaporanPriority = typeof LAPORAN_PRIORITY[keyof typeof LAPORAN_PRIORITY];
export type NotificationType = typeof NOTIFICATION_TYPE[keyof typeof NOTIFICATION_TYPE];