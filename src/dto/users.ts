import z from "zod";
import type { Laporan_karyawanGetPayload } from "../generated/prisma/models.js";

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

export interface UserHomeRes {
  karyawan: {
    nama_lengkap: string;
  },
  kategori: {
    nama_kategori: string;
  }[]
  acitivity: Array<{
    id: string;
    deskripsi_kendala: string;
    status: string;
    foto_masalah: string;
    lokasi: string;       
    nomor_lantai: number; 
    created_at: string;   
  }>
}

export type UserActivityRes = Laporan_karyawanGetPayload<{
  include: {
    lantai : {
      include : {
        lokasi : true
      }
    },
    kategori: true
  }
}>

export type CreateUserReq = z.infer<typeof CreateUserSchema>;
export type UpdateUserReq = z.infer<typeof UpdateUserSchema>;