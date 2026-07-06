/*
  Warnings:

  - The `foto_masalah` column on the `laporan_karyawan` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `catatan` to the `laporan_karyawan` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "checklist_harian" DROP CONSTRAINT "checklist_harian_ob_id_fkey";

-- AlterTable
ALTER TABLE "checklist_harian" ADD COLUMN     "catatan" TEXT,
ALTER COLUMN "ob_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "laporan_karyawan" ADD COLUMN     "catatan" TEXT NOT NULL,
DROP COLUMN "foto_masalah",
ADD COLUMN     "foto_masalah" VARCHAR(255)[];

-- AddForeignKey
ALTER TABLE "checklist_harian" ADD CONSTRAINT "checklist_harian_ob_id_fkey" FOREIGN KEY ("ob_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
