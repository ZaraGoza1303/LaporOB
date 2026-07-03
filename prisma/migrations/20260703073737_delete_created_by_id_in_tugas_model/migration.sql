/*
  Warnings:

  - You are about to drop the column `created_by_id` on the `tugas` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "tugas" DROP CONSTRAINT "tugas_created_by_id_fkey";

-- AlterTable
ALTER TABLE "laporan_karyawan" ADD COLUMN     "prioritas" VARCHAR(20) NOT NULL DEFAULT 'STANDARD';

-- AlterTable
ALTER TABLE "tugas" DROP COLUMN "created_by_id";
