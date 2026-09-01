/*
  Warnings:

  - You are about to drop the column `tanggal_mulai` on the `jadwal_checklist` table. All the data in the column will be lost.
  - You are about to drop the column `tanggal_selesai` on the `jadwal_checklist` table. All the data in the column will be lost.
  - You are about to drop the column `tanggal_spesifik` on the `jadwal_checklist` table. All the data in the column will be lost.
  - You are about to drop the column `tanggal_ulang` on the `jadwal_checklist` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "jadwal_checklist" DROP COLUMN "tanggal_mulai",
DROP COLUMN "tanggal_selesai",
DROP COLUMN "tanggal_spesifik",
DROP COLUMN "tanggal_ulang";

-- AlterTable
ALTER TABLE "tugas" ADD COLUMN     "hari" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "tanggal_mulai" TIMESTAMP(6),
ADD COLUMN     "tanggal_spesifik" TIMESTAMP(3)[] DEFAULT ARRAY[]::TIMESTAMP(3)[],
ADD COLUMN     "tanggal_ulang" INTEGER;
