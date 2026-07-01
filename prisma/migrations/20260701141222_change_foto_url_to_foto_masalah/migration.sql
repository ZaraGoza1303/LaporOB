/*
  Warnings:

  - You are about to drop the column `keterangan` on the `histori_pekerjaan` table. All the data in the column will be lost.
  - You are about to drop the column `foto_url` on the `laporan_karyawan` table. All the data in the column will be lost.
  - Added the required column `foto_selesai` to the `histori_pekerjaan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `foto_masalah` to the `laporan_karyawan` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "histori_pekerjaan" DROP COLUMN "keterangan",
ADD COLUMN     "foto_selesai" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "laporan_karyawan" DROP COLUMN "foto_url",
ADD COLUMN     "foto_masalah" TEXT NOT NULL;
