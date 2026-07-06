/*
  Warnings:

  - You are about to drop the column `ob_id` on the `histori_pekerjaan` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "histori_pekerjaan" DROP CONSTRAINT "histori_pekerjaan_ob_id_fkey";

-- AlterTable
ALTER TABLE "histori_pekerjaan" DROP COLUMN "ob_id";
