import z from "zod";
import { LAPORAN_PRIORITY, LAPORAN_STATUS } from "../utils/constants.js";

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
