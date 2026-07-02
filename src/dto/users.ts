import z from "zod";

export const CreateUserSchema = z.object({
  nama_lengkap: z.string().min(1, { message: 'Nama lengkap wajib diisi' }).trim(),
  username: z.string().min(3, { message: 'Username minimal 3 karakter' }).max(50, { message: 'Username maksimal 50 karakter' }).trim(),
  email: z.string().email().trim(),
  password: z.string().min(6, { message: 'Password minimal 6 karakter' }),
  role_id: z.string().uuid({ message: 'Format role_id harus UUID yang valid' }), 
});

export const UpdateUserSchema = CreateUserSchema.partial().extend({
});

export interface CreateUserRes {
  activationUrl: string,
}

export type CreateUserReq = z.infer<typeof CreateUserSchema>;
export type UpdateUserReq = z.infer<typeof UpdateUserSchema>;