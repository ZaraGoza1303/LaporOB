/*
  Warnings:

  - You are about to drop the column `finished_at` on the `laporan_karyawan` table. All the data in the column will be lost.
  - You are about to drop the column `ongoing_at` on the `laporan_karyawan` table. All the data in the column will be lost.
  - You are about to drop the column `pending_at` on the `laporan_karyawan` table. All the data in the column will be lost.
  - You are about to drop the column `rejected_at` on the `laporan_karyawan` table. All the data in the column will be lost.
  - You are about to drop the column `started_at` on the `laporan_karyawan` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "laporan_karyawan" DROP COLUMN "finished_at",
DROP COLUMN "ongoing_at",
DROP COLUMN "pending_at",
DROP COLUMN "rejected_at",
DROP COLUMN "started_at",
ADD COLUMN     "dikerjakan_at" TIMESTAMP(6),
ADD COLUMN     "ditolak_at" TIMESTAMP(6),
ADD COLUMN     "selesai_at" TIMESTAMP(6);
