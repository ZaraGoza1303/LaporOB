import type { AdminLaporanItemResponse } from "../types/admin.js";

const CSV_HEADERS = [
    "id_laporan",
    "nama_karyawan",
    "lokasi",
    "kategori",
    "prioritas",
    "status",
    "nama_ob",
    "created_at",
    "updated_at",
] as const;

export function escapeCsvCell(value: string | number | null | undefined): string {
    const text = value === null || value === undefined ? "" : String(value);
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toLaporanCsv(items: AdminLaporanItemResponse[]): string {
    const lines = [
        CSV_HEADERS.join(","),
        ...items.map((item) =>
            [
                item.id_laporan,
                item.nama_karyawan,
                item.lokasi,
                item.kategori,
                item.prioritas,
                item.status,
                item.nama_ob,
                item.created_at,
                item.updated_at,
            ]
                .map(escapeCsvCell)
                .join(","),
        ),
    ];
    return lines.join("\n");
}

export function buildExportFilename(prefix: string, now: Date = new Date()): string {
    const pad = (n: number) => String(n).padStart(2, "0");
    const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
    return `${prefix}-${stamp}.csv`;
}
