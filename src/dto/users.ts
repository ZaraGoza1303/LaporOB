import z from "zod";

export const CreateUserSchema = z.object({
  username: z.string().min(3, { message: 'Username minimal 3 karakter' }).max(50, { message: 'Username maksimal 50 karakter' }).trim(),
  password: z.string().min(6, { message: 'Password minimal 6 karakter' }),
  nama_lengkap: z.string().min(1, { message: 'Nama lengkap wajib diisi' }).trim(),
  role_id: z.string().uuid({ message: 'Format role_id harus UUID yang valid' }), 
});

export const UpdateUserSchema = CreateUserSchema.partial().extend({
});

export type CreateUserReq = z.infer<typeof CreateUserSchema>;
export type UpdateUserReq = z.infer<typeof UpdateUserSchema>;