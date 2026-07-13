/*
  Warnings:

  - You are about to drop the column `ref_id` on the `notifikasi` table. All the data in the column will be lost.
  - You are about to drop the column `ref_tipe` on the `notifikasi` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `notifikasi` table. All the data in the column will be lost.
  - Added the required column `penerima_id` to the `notifikasi` table without a default value. This is not possible if the table is not empty.
  - Made the column `pengirim_id` on table `notifikasi` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "notifikasi" DROP CONSTRAINT "notifikasi_pengirim_id_fkey";

-- DropForeignKey
ALTER TABLE "notifikasi" DROP CONSTRAINT "notifikasi_user_id_fkey";

-- AlterTable
ALTER TABLE "notifikasi" DROP COLUMN "ref_id",
DROP COLUMN "ref_tipe",
DROP COLUMN "user_id",
ADD COLUMN     "penerima_id" UUID NOT NULL,
ALTER COLUMN "pengirim_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "notifikasi" ADD CONSTRAINT "notifikasi_penerima_id_fkey" FOREIGN KEY ("penerima_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifikasi" ADD CONSTRAINT "notifikasi_pengirim_id_fkey" FOREIGN KEY ("pengirim_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
