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
