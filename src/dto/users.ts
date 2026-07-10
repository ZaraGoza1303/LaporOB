import z from "zod";
import type { Laporan_karyawanGetPayload } from "../generated/prisma/models.js";
import { LAPORAN_PRIORITY, LAPORAN_STATUS, type LaporanPriority, type LaporanStatus } from "../utils/constants.js";
import type { PaginatedResponse } from "./response.js";

export const UserIdParamSchema = z.object({
  user_id: z.string().trim().uuid({ message: "Format user_id harus UUID yang valid" }),
});

export const CreateUserSchema = z.object({
  nama_lengkap: z.string().trim().min(1, { message: 'Nama lengkap wajib diisi' }),
  username: z.string().trim().min(3, { message: 'Username minimal 3 karakter' }).max(50, { message: 'Username maksimal 50 karakter' }),
  email: z.string().trim().email(),
  role_id: z.string().trim().uuid({ message: 'Format role_id harus UUID yang valid' }),
});

export const UpdateUserSchema = z.object({
  nama_lengkap: z.string().trim().min(1, { message: 'Nama lengkap wajib diisi' }).optional(),
  username: z.string().trim().min(3, { message: 'Username minimal 3 karakter' }).max(50, { message: 'Username maksimal 50 karakter' }).optional(),
  email: z.string().trim().email().optional(),
  password: z.string().trim().min(6, { message: 'Password minimal 6 karakter' }).optional(),
  role_id: z.string().trim().uuid({ message: 'Format role_id harus UUID yang valid' }).optional(),
});

export const UpdateProfileSchema = CreateUserSchema.pick({
  nama_lengkap: true,
}).partial();

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
    status: LaporanStatus;
    foto_masalah: string[];
    lokasi: string;
    nomor_lantai: number;
    created_at: string;
  }>
}

export type UserActivityRes = Laporan_karyawanGetPayload<{
  include: {
    lantai: {
      include: {
        lokasi: true
      }
    },
    kategori: true
  }
}>

export interface CreateLaporanKaryawanInput {
  kategori_id: string;
  prioritas: LaporanPriority;
  lantai_id: string;
  deskripsi_kendala: string;
  foto_masalah: string[];
}

export const LaporanIdParamSchema = z.object({
  laporan_id: z.string().trim().uuid({ message: "Format laporan_id harus UUID yang valid" }),
});

export const CreateLaporanKaryawanSchema = z.object({
  kategori_id: z.string().trim().uuid({ message: "Format kategori_id harus berupa UUID yang valid" }),
  prioritas: z.enum([LAPORAN_PRIORITY.STANDARD, LAPORAN_PRIORITY.URGENT]),
  lantai_id: z.string().trim().uuid({ message: "Format lantai_id harus berupa UUID yang valid" }),
  deskripsi_kendala: z.string().trim().min(1, { message: "Deskripsi kendala tidak boleh kosong" }),
});

export type CreateUserReq = z.infer<typeof CreateUserSchema>;
export type UpdateUserReq = z.infer<typeof UpdateUserSchema> & {
  profile_picture?: string;
};
export type UpdateProfileReq = z.infer<typeof UpdateProfileSchema> & {
  profile_picture?: string;
};
export type CreateLaporanKaryawanReq = z.infer<typeof CreateLaporanKaryawanSchema>;

const emptyToNull = (val: unknown) => (val === "" || val === undefined ? null : val);

const laporanStatusValues = [
  LAPORAN_STATUS.BELUM_DIKERJAKAN,
  LAPORAN_STATUS.PENDING,
  LAPORAN_STATUS.SELESAI,
  LAPORAN_STATUS.DITOLAK,
] as const;

export const ProfileLaporanQuerySchema = z.object({
  search: z.preprocess(emptyToNull, z.string().nullable()),
  status: z.preprocess(emptyToNull, z.enum(laporanStatusValues).nullable()),
  cursor: z.preprocess(emptyToNull, z.string().nullable()),
  limit: z.preprocess(
    (val) => (val === "" || val === undefined ? undefined : val),
    z.coerce.number().int().positive().default(10),
  ),
});

export type ProfileLaporanQuery = z.infer<typeof ProfileLaporanQuerySchema>;

export interface GetProfileReq {
  role: string;
  cursor?: string | null;
  search?: string | null;
  status?: string | null;
}

export interface MappedProfileReport {
  id: string;
  kategori: string;
  deskripsi_kendala: string;
  status: LaporanStatus;
  prioritas: LaporanPriority;
  foto_masalah: string[];
  lokasi: string;
  nomor_lantai: number;
  nama_ob: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileRes {
  user: {
    id: string;
    nama_lengkap: string;
    username: string;
    email: string;
    role: string;
    profile_picture: string | null;
    total_laporan?: number; //Karyawan
    tasksCompleted?: number; // OB
    rejected?: number; // OB
  };
  laporan: PaginatedResponse<MappedProfileReport>;
}

export interface MappedReportDetailRes {
  id: string;
  kategori: string;
  deskripsi_kendala: string;
  status: LaporanStatus;
  prioritas: LaporanPriority;
  foto_masalah: string[];
  foto_selesai: string[];
  catatan: string;
  lokasi: string;
  nomor_lantai: number;
  nama_karyawan: string;
  nama_ob: string | null;
  created_at: string;
}
