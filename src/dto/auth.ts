import z from "zod";

export const LoginSchema = z.object({
    identifier: z.string().min(1, 'email atau username required'),
    password: z.string().min(1, 'password required'),
})

export type LoginRes = {
    jwt_token: string;
}

export type LoginUserData = {
    id: string;
    username: string;
    nama_lengkap: string;
    password: string;
    is_active: boolean;
    role: {
        id: string;
        nama_role: string;
        created_at: Date;
    }
}

export type LoginReq = z.infer<typeof LoginSchema>;
 