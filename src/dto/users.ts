import z from "zod";
import type { Laporan_karyawanGetPayload } from "../generated/prisma/models.js";
import { LAPORAN_PRIORITY, LAPORAN_STATUS, type LaporanPriority, type LaporanStatus } from "../utils/constants.js";
import type { PaginatedResponse } from "./response.js";
import type { AdminProfileData } from "./admin.js";

export const UserIdParamSchema = z.object({
  user_id: z.string().trim().uuid({ message: "Format user_id harus UUID yang valid" }),
});

const emptyToUndefined = (val: unknown) => {
  if (val === "" || val === null || val === undefined) return undefined;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
      return [val];
    } catch {
      return [val];
    }
  }
  return val;
};

export const CreateUserSchema = z.object({
  nama_lengkap: z.string().trim().min(1, { message: 'Nama lengkap wajib diisi' }),
  username: z.string().trim().min(3, { message: 'Username minimal 3 karakter' }).max(50, { message: 'Username maksimal 50 karakter' }),
  email: z.string().trim().email(),
  role_id: z.string().trim().uuid({ message: 'Format role_id harus UUID yang valid' }),
  lokasi_ids: z.preprocess(
    emptyToUndefined,
    z.array(z.string().trim().uuid({ message: 'Format lokasi_id harus UUID yang valid' })).optional()
  ),
});

export const UpdateUserSchema = CreateUserSchema.extend({
  password: z.string().trim().min(6, { message: 'Password minimal 6 karakter' }).optional(),
  is_active: z.boolean().optional(),
}).partial();

export const UpdateProfileSchema = CreateUserSchema.pick({
  nama_lengkap: true,
}).partial().strict();

// export interface CreateUserRes {
//   activationUrl: string,
// }

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
  ruangan_id: string;
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
  ruangan_id: z.string().trim().uuid({ message: "Format ruangan_id harus berupa UUID yang valid" }),
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
  LAPORAN_STATUS.DIBATALKAN,
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

import type { TugasDetailRes } from "./tugas.js";

export interface ProfileRes {
  user: {
    id: string;
    nama_lengkap: string;
    username: string;
    email: string;
    role: string;
    profile_picture: string | null;
    total_laporan?: number;
    tasksCompleted?: number;
    laporanSelesai?: number;
    rejected?: number;
    admin?: AdminProfileData;
    lokasiAktif?: Array<{
      id: string;
      nama_lokasi: string;
      status: string;
    }>;
  };
  laporan?: PaginatedResponse<MappedProfileReport>;
  tugas?: PaginatedResponse<TugasDetailRes>;
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
  is_kolaborasi_open: boolean;
  catatan_kolaborasi: string | null;
  dikerjakan_at: string | null;
  selesai_at: string | null;
  total_durasi: number | null;
  created_at: string;
}

export interface UserProfileResponse {
  id: string;
  nama_lengkap: string;
  username: string;
  email: string;
  role: string;
  profile_picture: string | null;
  total_laporan?: number;
}

export interface ObProfileResponse {
  id: string;
  nama_lengkap: string;
  username: string;
  email: string;
  role: string;
  profile_picture: string | null;
  laporanSelesai: number;
  lokasiAktif: Array<{
    id: string;
    nama_lokasi: string;
    status: string;
  }>
}
