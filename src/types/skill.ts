export interface ObSkillRes {
    id: string;
    skill_id: string;
    nama_skill: string;
    keyword: string[];
    deskripsi?: string | null;
    jumlah_selesai: number;
    assigned_by?: string | null;
    diperoleh_at?: Date | null;
    created_at: Date;
    updated_at: Date;
}

export interface SkillDefinitionRes {
    id: string;
    nama_skill: string;
    keyword: string[];
    deskripsi?: string | null;
    is_auto: boolean;
    is_active: boolean;
    threshold: number;
    created_at: Date;
    updated_at: Date;
}
