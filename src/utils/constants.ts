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
    DIBATALKAN: "DIBATALKAN",
} as const;

export const LAPORAN_PRIORITY = {
    URGENT: "URGENT",
    STANDARD: "STANDARD",
} as const;

export const KOLABORASI_STATUS = {
    PENDING: "PENDING",
    APPROVED: "APPROVED",
    REJECTED: "REJECTED",
} as const;

export const NOTIFICATION_TYPE = {
    LAPORAN_BARU: "LAPORAN_BARU",
    LAPORAN_DIKERJAKAN: "LAPORAN_DIKERJAKAN",
    LAPORAN_BERES: "LAPORAN_BERES",
    LAPORAN_DIBATALKAN: "LAPORAN_DIBATALKAN",
    CHECKLIST_SELESAI: "CHECKLIST_SELESAI",
    PENUGASAN_CHECKLIST: "PENUGASAN_CHECKLIST",
    GABUNG_LAPORAN: "GABUNG_LAPORAN",
    GABUNG_DISETUJUI: "GABUNG_DISETUJUI",
    GABUNG_DITOLAK: "GABUNG_DITOLAK",
    KELUAR_KOLABORASI: "KELUAR_KOLABORASI",
    DIKELUARKAN_KOLABORASI: "DIKELUARKAN_KOLABORASI",
    KOLABORASI_DIBUKA: "KOLABORASI_DIBUKA",
} as const;

export const NOTIFICATION_TITLE = {
    LAPORAN_BARU: "Laporan baru",
    LAPORAN_DIKERJAKAN: "Laporan sedang dikerjakan",
    LAPORAN_BERES: "Laporan selesai",
    LAPORAN_DIBATALKAN: "Laporan dibatalkan",
    CHECKLIST_SELESAI: "Checklist harian selesai",
    PENUGASAN_CHECKLIST: "Penugasan checklist harian",
    GABUNG_LAPORAN: "Permintaan bergabung",
    GABUNG_DISETUJUI: "Bergabung disetujui",
    GABUNG_DITOLAK: "Bergabung ditolak",
    KELUAR_KOLABORASI: "OB keluar dari kolaborasi",
    DIKELUARKAN_KOLABORASI: "Dikeluarkan dari kolaborasi",
    KOLABORASI_DIBUKA: "Kolaborasi dibuka",
} as const;

export const NOTIFICATION_MESSAGE = {
    LAPORAN_DIKERJAKAN: "Laporan anda sedang dikerjakan oleh OB",
    ADMIN_MENUGASKAN_OB: "Admin baru saja menugaskan anda",
    GABUNG_LAPORAN: "OB meminta bergabung mengerjakan laporan",
    GABUNG_DISETUJUI: "Permintaan bergabung anda disetujui",
    GABUNG_DITOLAK: "Permintaan bergabung anda ditolak",
    KELUAR_KOLABORASI: "OB telah keluar dari kolaborasi laporan",
    DIKELUARKAN_KOLABORASI: "Anda telah dikeluarkan dari kolaborasi laporan oleh OB utama",
    KOLABORASI_DIBUKA: "Laporan telah dibuka untuk kolaborasi",
} as const;

export const USER_ROLE = {
    OB: "ob",
    HR: "hr",
    ADMIN: "admin",
    KARYAWAN: "karyawan",
} as const;

export type LaporanStatus = typeof LAPORAN_STATUS[keyof typeof LAPORAN_STATUS];
export type LaporanPriority = typeof LAPORAN_PRIORITY[keyof typeof LAPORAN_PRIORITY];
export type NotificationType = typeof NOTIFICATION_TYPE[keyof typeof NOTIFICATION_TYPE];
export type NotificationTitle = typeof NOTIFICATION_TITLE[keyof typeof NOTIFICATION_TITLE];
export type UserRoleType = typeof USER_ROLE[keyof typeof USER_ROLE];
