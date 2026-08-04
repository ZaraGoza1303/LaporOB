import { z } from 'zod';
import { LAPORAN_PRIORITY, LAPORAN_STATUS } from '../utils/constants.js';

export const GetDashboardQuerySchema = z.object({
    period: z.enum(['harian', 'mingguan', 'bulanan', 'tahunan']).default('mingguan'),
});
export type GetDashboardQuery = z.infer<typeof GetDashboardQuerySchema>;

const emptyToNull = (val: unknown) => (val === "" || val === undefined ? null : val);

export const AdminLaporanQuerySchema = z.object({
    search: z.preprocess(emptyToNull, z.string().nullable()),
    status: z.preprocess(emptyToNull, z.enum(Object.values(LAPORAN_STATUS) as [string, ...string[]]).nullable()),
    prioritas: z.preprocess(emptyToNull, z.enum(Object.values(LAPORAN_PRIORITY) as [string, ...string[]]).nullable()),
    lokasi_id: z.preprocess(emptyToNull, z.string().uuid({ message: "Format lokasi_id harus UUID yang valid" }).nullable()),
    lantai_id: z.preprocess(emptyToNull, z.string().uuid({ message: "Format lantai_id harus UUID yang valid" }).nullable()),
    start_date: z.preprocess(emptyToNull, z.coerce.date().nullable()),
    end_date: z.preprocess(emptyToNull, z.coerce.date().nullable()),
    sort_by: z.enum(["created_at", "updated_at", "prioritas", "status", "nama_karyawan", "lokasi"]).default("created_at"),
    sort_order: z.enum(["asc", "desc"]).default("desc"),
});

export const AdminLaporanHistoryQuerySchema = z.object({
    search: z.preprocess(emptyToNull, z.string().nullable()),
    user_id: z.preprocess(emptyToNull, z.string().uuid({ message: "Format user_id harus UUID yang valid" }).nullable().optional()),
});

export type AdminLaporanQuery = z.infer<typeof AdminLaporanQuerySchema>;
export type AdminLaporanHistoryQuery = z.infer<typeof AdminLaporanHistoryQuerySchema>;

export const UserSearchQuerySchema = z.object({
    search: z.preprocess(emptyToNull, z.string().nullable()),
    role_id: z.preprocess(emptyToNull, z.string().uuid({ message: "Format role_id harus UUID yang valid" }).nullable()),
});

export type UserSearchQuery = z.infer<typeof UserSearchQuerySchema>;

export const PatchLaporanReqSchema = z.object({
    status: z.preprocess(
        emptyToNull,
        z.enum(Object.values(LAPORAN_STATUS) as [string, ...string[]]).nullable().optional()
    ),
    prioritas: z.preprocess(
        emptyToNull,
        z.enum(Object.values(LAPORAN_PRIORITY) as [string, ...string[]]).nullable().optional()
    ),
    ob_id: z.preprocess(
        emptyToNull,
        z.string().uuid({ message: "Format ob_id harus UUID yang valid" }).nullable().optional()
    ),
    admin_catatan: z.preprocess(
        emptyToNull,
        z.string().max(1000).nullable().optional()
    ),
    lantai_id: z.preprocess(
        emptyToNull,
        z.string().uuid({ message: "Format lantai_id harus UUID yang valid" }).optional()
    ),
    ruangan_id: z.preprocess(
        emptyToNull,
        z.string().uuid({ message: "Format ruangan_id harus UUID yang valid" }).optional()
    ),
}).refine(data => Object.values(data).some(v => v !== undefined && v !== null), {
    message: "Setidaknya satu field harus diisi"
});

export type PatchLaporanReq = z.infer<typeof PatchLaporanReqSchema>;

export const AssignObToLocationsSchema = z.object({
    ob_id: z.string().uuid({ message: "Format ob_id harus UUID yang valid" }),
    lokasi_ids: z.array(z.string().uuid({ message: "Format lokasi_id harus UUID yang valid" })),
    bulan: z.coerce.number().int().min(1).max(12).default(() => new Date().getMonth() + 1),
    tahun: z.coerce.number().int().min(2000).max(2100).default(() => new Date().getFullYear()),
});

export type AssignObToLocationsReq = z.infer<typeof AssignObToLocationsSchema>;

export const StatsTugasQuerySchema = z.object({
    period: z.enum(['harian', 'mingguan', 'bulanan', 'tahunan']).default('harian'),
    lokasi_id: z.string().uuid().optional(),
});
export type StatsTugasQuery = z.infer<typeof StatsTugasQuerySchema>;

export const StatsLaporanQuerySchema = z.object({
    period: z.enum(['harian', 'mingguan', 'bulanan', 'tahunan']).default('harian'),
    lokasi_id: z.string().uuid().optional(),
});
export type StatsLaporanQuery = z.infer<typeof StatsLaporanQuerySchema>;

export const PekerjaanListQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    search: z.string().optional(),
});
export type PekerjaanListQuery = z.infer<typeof PekerjaanListQuerySchema>;

export const ObPerformanceDashboardQuerySchema = z.object({
    period: z.enum(['harian', 'mingguan', 'bulanan', 'tahunan']).default('bulanan'),
});
export type ObPerformanceDashboardQuery = z.infer<typeof ObPerformanceDashboardQuerySchema>;