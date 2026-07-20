import z from "zod";

export const TokenQuerySchema = z.object({
    token: z.string().trim().min(1, { message: "Token wajib diisi" })
});

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
    password: z.string().min(1, { message: 'Password wajib 6 karakter' }),
    confirmPassword: z.string().min(6, { message: 'Konfirmasi password minimal 6 karakter' }),
}).refine(data => data.password === data.confirmPassword, {
    message: "Password dan konfirmasi password tidak cocok",
    path: ["confirmPassword"],
});

export type ActivateAccountReq = z.infer<typeof ActivateAccountSchema>;

export const ForgotPasswordSchema = z.object({
    email: z.string().trim().email({ message: "Format email tidak valid" }),
});
export type ForgotPasswordReq = z.infer<typeof ForgotPasswordSchema>;

export const ResetPasswordSchema = z.object({
    password: z.string().min(6, { message: 'Password minimal 6 karakter' }),
    confirmPassword: z.string().min(6, { message: 'Konfirmasi password minimal 6 karakter' }),
}).refine(data => data.password === data.confirmPassword, {
    message: "Password dan konfirmasi password tidak cocok",
    path: ["confirmPassword"],
});
export type ResetPasswordReq = z.infer<typeof ResetPasswordSchema>;

export const ChangePasswordSchema = z.object({
    oldPassword: z.string().min(1, { message: 'Password lama wajib diisi' }),
    newPassword: z.string().min(6, { message: 'Password baru minimal 6 karakter' }),
    confirmNewPassword: z.string().min(6, { message: 'Konfirmasi password baru minimal 6 karakter' }),
}).refine(data => data.newPassword === data.confirmNewPassword, {
    message: "Password baru dan konfirmasi tidak cocok",
    path: ["confirmNewPassword"],
});
export type ChangePasswordReq = z.infer<typeof ChangePasswordSchema>;
