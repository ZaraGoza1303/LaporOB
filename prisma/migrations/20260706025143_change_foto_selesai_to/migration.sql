/*
  Warnings:

  - The `foto_selesai` column on the `histori_pekerjaan` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "histori_pekerjaan" DROP COLUMN "foto_selesai",
ADD COLUMN     "foto_selesai" VARCHAR(255)[];
