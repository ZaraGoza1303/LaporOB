import z from "zod";

export const ACHIEVEMENT_TYPES = ["KEYWORD", "COMPLETION_COUNT", "FAST_RESPONSE"] as const;

export const AchievementIdParamSchema = z.object({
    achievement_id: z.string().trim().uuid({ message: "Format achievement_id harus UUID yang valid" }),
});

export const CreateAchievementSchema = z.object({
    nama: z.string().min(1, { message: "Nama achievement wajib diisi" }).max(100, { message: "Maksimal 100 karakter" }),
    deskripsi: z.string().optional(),
    tipe: z.enum(ACHIEVEMENT_TYPES).optional().default("KEYWORD"),
    keyword: z.array(z.string()).default([]),
    threshold: z.coerce.number().int().min(0).default(5),
    response_time_threshold_seconds: z.coerce.number().int().positive().optional().nullable(),
    icon: z.string().optional().nullable(),
});

export const UpdateAchievementSchema = z.object({
    nama: z.string().min(1).max(100).optional(),
    deskripsi: z.string().optional().nullable(),
    tipe: z.enum(ACHIEVEMENT_TYPES).optional(),
    keyword: z.array(z.string()).optional(),
    threshold: z.coerce.number().int().min(0).optional(),
    response_time_threshold_seconds: z.coerce.number().int().positive().optional().nullable(),
    icon: z.string().optional().nullable(),
    is_active: z.boolean().optional(),
});

export type CreateAchievementReq = z.infer<typeof CreateAchievementSchema>;
export type UpdateAchievementReq = z.infer<typeof UpdateAchievementSchema>;

export interface AchievementRes {
    id: string;
    nama: string;
    deskripsi?: string | null;
    tipe: string;
    keyword: string[];
    threshold: number;
    response_time_threshold_seconds?: number | null;
    icon?: string | null;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface ObAchievementRes {
    id: string;
    achievement_id: string;
    nama: string;
    tipe: string;
    keyword: string[];
    deskripsi?: string | null;
    progress: number;
    diperoleh_at?: Date | null;
    icon?: string | null;
    created_at: Date;
    updated_at: Date;
}
