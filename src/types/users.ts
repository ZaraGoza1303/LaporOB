import type { Laporan_karyawanGetPayload } from "../generated/prisma/models.js";
import type { LaporanPriority, LaporanStatus } from "../utils/constants.js";
import type { PaginatedResponse } from "./response.js";
import type { AdminProfileData } from "./admin.js";

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
    total_laporan?: number;
    tasksCompleted?: number;
    rejected?: number;
    admin?: AdminProfileData;
    lokasiAktif?: Array<{
      id: string;
      nama_lokasi: string;
      status: string;
    }>;
  };
  laporan?: PaginatedResponse<MappedProfileReport>;
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
  laporanDiterima: number;
  laporanSelesai: number;
  lokasiAktif: Array<{
    id: string;
    nama_lokasi: string;
    status: string;
  }>
}
