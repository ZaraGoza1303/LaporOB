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
    password: string | null;
    is_active: boolean;
    role: {
        id: string;
        nama_role: string;
        created_at: Date;
    }
}

export type LoginReq = z.infer<typeof LoginSchema>;

export const ActivateAccountSchema = z.object({
    password: z.string().min(6, { message: 'Password minimal 6 karakter' }),
    confirmPassword: z.string().min(6, { message: 'Konfirmasi password minimal 6 karakter' }),
}).refine(data => data.password === data.confirmPassword, {
    message: "Password dan konfirmasi password tidak cocok",
    path: ["confirmPassword"],
});

export type ActivateAccountReq = z.infer<typeof ActivateAccountSchema>;
 