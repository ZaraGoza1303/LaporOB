export type LoginRes = {
    jwt_token: string;
}

export type LoginUserData = {
    id: string;
    username: string;
    nama_lengkap: string;
    password: string | null;
    is_active: boolean;
    role: {
        id: string;
        nama_role: string;
        created_at: Date;
    }
}
