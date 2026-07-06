/*
  Warnings:

  - You are about to drop the column `catatan` on the `laporan_karyawan` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "histori_pekerjaan" ADD COLUMN     "catatan" TEXT;

-- AlterTable
ALTER TABLE "laporan_karyawan" DROP COLUMN "catatan";
