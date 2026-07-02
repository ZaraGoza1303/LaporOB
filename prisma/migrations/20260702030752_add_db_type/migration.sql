/*
  Warnings:

  - The primary key for the `checklist_harian` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `status` on the `checklist_harian` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(30)`.
  - The primary key for the `histori_pekerjaan` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `status_aksi` on the `histori_pekerjaan` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(30)`.
  - You are about to alter the column `foto_selesai` on the `histori_pekerjaan` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - The primary key for the `kategori` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `nama_kategori` on the `kategori` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - The primary key for the `lantai` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `laporan_karyawan` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `ob_id` column on the `laporan_karyawan` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to alter the column `status` on the `laporan_karyawan` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(30)`.
  - You are about to alter the column `foto_masalah` on the `laporan_karyawan` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - The primary key for the `lokasi` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `nama_lokasi` on the `lokasi` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - The primary key for the `role` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `nama_role` on the `role` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - The primary key for the `tugas` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `nama_tugas` on the `tugas` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(150)`.
  - The `created_by_id` column on the `tugas` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `user` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `username` on the `user` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `password` on the `user` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `nama_lengkap` on the `user` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `email` on the `user` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - Changed the type of `id` on the `checklist_harian` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `ob_id` on the `checklist_harian` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `lantai_id` on the `checklist_harian` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `kategori_id` on the `checklist_harian` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `tugas_id` on the `checklist_harian` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `histori_pekerjaan` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `laporan_karyawan_id` on the `histori_pekerjaan` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `ob_id` on the `histori_pekerjaan` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `kategori` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `lantai` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `lokasi_id` on the `lantai` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `laporan_karyawan` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `pelapor_id` on the `laporan_karyawan` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `lantai_id` on the `laporan_karyawan` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `kategori_id` on the `laporan_karyawan` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `lokasi` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `role` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `tugas` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `kategori_id` on the `tugas` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `user` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `role_id` on the `user` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "checklist_harian" DROP CONSTRAINT "checklist_harian_kategori_id_fkey";

-- DropForeignKey
ALTER TABLE "checklist_harian" DROP CONSTRAINT "checklist_harian_lantai_id_fkey";

-- DropForeignKey
ALTER TABLE "checklist_harian" DROP CONSTRAINT "checklist_harian_ob_id_fkey";

-- DropForeignKey
ALTER TABLE "checklist_harian" DROP CONSTRAINT "checklist_harian_tugas_id_fkey";

-- DropForeignKey
ALTER TABLE "histori_pekerjaan" DROP CONSTRAINT "histori_pekerjaan_laporan_karyawan_id_fkey";

-- DropForeignKey
ALTER TABLE "histori_pekerjaan" DROP CONSTRAINT "histori_pekerjaan_ob_id_fkey";

-- DropForeignKey
ALTER TABLE "lantai" DROP CONSTRAINT "lantai_lokasi_id_fkey";

-- DropForeignKey
ALTER TABLE "laporan_karyawan" DROP CONSTRAINT "laporan_karyawan_kategori_id_fkey";

-- DropForeignKey
ALTER TABLE "laporan_karyawan" DROP CONSTRAINT "laporan_karyawan_lantai_id_fkey";

-- DropForeignKey
ALTER TABLE "laporan_karyawan" DROP CONSTRAINT "laporan_karyawan_ob_id_fkey";

-- DropForeignKey
ALTER TABLE "laporan_karyawan" DROP CONSTRAINT "laporan_karyawan_pelapor_id_fkey";

-- DropForeignKey
ALTER TABLE "tugas" DROP CONSTRAINT "tugas_created_by_id_fkey";

-- DropForeignKey
ALTER TABLE "tugas" DROP CONSTRAINT "tugas_kategori_id_fkey";

-- DropForeignKey
ALTER TABLE "user" DROP CONSTRAINT "user_role_id_fkey";

-- AlterTable
ALTER TABLE "checklist_harian" DROP CONSTRAINT "checklist_harian_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "ob_id",
ADD COLUMN     "ob_id" UUID NOT NULL,
DROP COLUMN "lantai_id",
ADD COLUMN     "lantai_id" UUID NOT NULL,
DROP COLUMN "kategori_id",
ADD COLUMN     "kategori_id" UUID NOT NULL,
DROP COLUMN "tugas_id",
ADD COLUMN     "tugas_id" UUID NOT NULL,
ALTER COLUMN "status" SET DATA TYPE VARCHAR(30),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(6),
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(6),
ADD CONSTRAINT "checklist_harian_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "histori_pekerjaan" DROP CONSTRAINT "histori_pekerjaan_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "laporan_karyawan_id",
ADD COLUMN     "laporan_karyawan_id" UUID NOT NULL,
DROP COLUMN "ob_id",
ADD COLUMN     "ob_id" UUID NOT NULL,
ALTER COLUMN "status_aksi" SET DATA TYPE VARCHAR(30),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(6),
ALTER COLUMN "foto_selesai" SET DATA TYPE VARCHAR(255),
ADD CONSTRAINT "histori_pekerjaan_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "kategori" DROP CONSTRAINT "kategori_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ALTER COLUMN "nama_kategori" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(6),
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(6),
ADD CONSTRAINT "kategori_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "lantai" DROP CONSTRAINT "lantai_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "lokasi_id",
ADD COLUMN     "lokasi_id" UUID NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(6),
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(6),
ADD CONSTRAINT "lantai_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "laporan_karyawan" DROP CONSTRAINT "laporan_karyawan_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "pelapor_id",
ADD COLUMN     "pelapor_id" UUID NOT NULL,
DROP COLUMN "ob_id",
ADD COLUMN     "ob_id" UUID,
DROP COLUMN "lantai_id",
ADD COLUMN     "lantai_id" UUID NOT NULL,
DROP COLUMN "kategori_id",
ADD COLUMN     "kategori_id" UUID NOT NULL,
ALTER COLUMN "status" SET DATA TYPE VARCHAR(30),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(6),
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(6),
ALTER COLUMN "foto_masalah" SET DATA TYPE VARCHAR(255),
ADD CONSTRAINT "laporan_karyawan_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "lokasi" DROP CONSTRAINT "lokasi_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ALTER COLUMN "nama_lokasi" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(6),
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(6),
ADD CONSTRAINT "lokasi_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "role" DROP CONSTRAINT "role_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ALTER COLUMN "nama_role" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(6),
ADD CONSTRAINT "role_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "tugas" DROP CONSTRAINT "tugas_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "kategori_id",
ADD COLUMN     "kategori_id" UUID NOT NULL,
ALTER COLUMN "nama_tugas" SET DATA TYPE VARCHAR(150),
DROP COLUMN "created_by_id",
ADD COLUMN     "created_by_id" UUID,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(6),
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(6),
ADD CONSTRAINT "tugas_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "user" DROP CONSTRAINT "user_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ALTER COLUMN "username" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "password" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "nama_lengkap" SET DATA TYPE VARCHAR(100),
DROP COLUMN "role_id",
ADD COLUMN     "role_id" UUID NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(6),
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(6),
ALTER COLUMN "email" SET DATA TYPE VARCHAR(100),
ADD CONSTRAINT "user_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lantai" ADD CONSTRAINT "lantai_lokasi_id_fkey" FOREIGN KEY ("lokasi_id") REFERENCES "lokasi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tugas" ADD CONSTRAINT "tugas_kategori_id_fkey" FOREIGN KEY ("kategori_id") REFERENCES "kategori"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tugas" ADD CONSTRAINT "tugas_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_harian" ADD CONSTRAINT "checklist_harian_ob_id_fkey" FOREIGN KEY ("ob_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_harian" ADD CONSTRAINT "checklist_harian_lantai_id_fkey" FOREIGN KEY ("lantai_id") REFERENCES "lantai"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_harian" ADD CONSTRAINT "checklist_harian_kategori_id_fkey" FOREIGN KEY ("kategori_id") REFERENCES "kategori"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_harian" ADD CONSTRAINT "checklist_harian_tugas_id_fkey" FOREIGN KEY ("tugas_id") REFERENCES "tugas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "laporan_karyawan" ADD CONSTRAINT "laporan_karyawan_pelapor_id_fkey" FOREIGN KEY ("pelapor_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "laporan_karyawan" ADD CONSTRAINT "laporan_karyawan_ob_id_fkey" FOREIGN KEY ("ob_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "laporan_karyawan" ADD CONSTRAINT "laporan_karyawan_lantai_id_fkey" FOREIGN KEY ("lantai_id") REFERENCES "lantai"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "laporan_karyawan" ADD CONSTRAINT "laporan_karyawan_kategori_id_fkey" FOREIGN KEY ("kategori_id") REFERENCES "kategori"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "histori_pekerjaan" ADD CONSTRAINT "histori_pekerjaan_laporan_karyawan_id_fkey" FOREIGN KEY ("laporan_karyawan_id") REFERENCES "laporan_karyawan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "histori_pekerjaan" ADD CONSTRAINT "histori_pekerjaan_ob_id_fkey" FOREIGN KEY ("ob_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
