/*
  Warnings:

  - You are about to drop the column `alasan_gagal` on the `checklist_harian` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `checklist_harian` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "checklist_harian" DROP COLUMN "alasan_gagal",
DROP COLUMN "notes";

-- AlterTable
ALTER TABLE "laporan_karyawan" ADD COLUMN     "alasan_gagal" TEXT;
