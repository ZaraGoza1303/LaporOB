/*
  Warnings:

  - You are about to drop the column `auto_generate` on the `checklist_harian` table. All the data in the column will be lost.
  - Added the required column `tanggal_mulai` to the `tugas` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tanggal_selesai` to the `tugas` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "tugas" DROP CONSTRAINT "tugas_lantai_id_fkey";

-- DropForeignKey
ALTER TABLE "tugas" DROP CONSTRAINT "tugas_ob_id_fkey";

-- AlterTable
ALTER TABLE "checklist_harian" DROP COLUMN "auto_generate",
ALTER COLUMN "nama_tugas" DROP DEFAULT;

-- AlterTable
ALTER TABLE "tugas" ADD COLUMN     "tanggal_mulai" TIMESTAMP(6) NOT NULL,
ADD COLUMN     "tanggal_selesai" TIMESTAMP(6) NOT NULL;

-- CreateTable
CREATE TABLE "jadwal_checklist" (
    "id" UUID NOT NULL,
    "nama_tugas" VARCHAR(150) NOT NULL,
    "lantai_id" UUID NOT NULL,
    "kategori_id" UUID NOT NULL,
    "ob_id" UUID,
    "hari" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tanggal_ulang" INTEGER,
    "tanggal_spesifik" TIMESTAMP(3)[] DEFAULT ARRAY[]::TIMESTAMP(3)[],
    "tanggal_mulai" TIMESTAMP(6) NOT NULL,
    "tanggal_selesai" TIMESTAMP(6) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "jadwal_checklist_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "tugas" ADD CONSTRAINT "tugas_lantai_id_fkey" FOREIGN KEY ("lantai_id") REFERENCES "lantai"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tugas" ADD CONSTRAINT "tugas_ob_id_fkey" FOREIGN KEY ("ob_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jadwal_checklist" ADD CONSTRAINT "jadwal_checklist_ob_id_fkey" FOREIGN KEY ("ob_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jadwal_checklist" ADD CONSTRAINT "jadwal_checklist_lantai_id_fkey" FOREIGN KEY ("lantai_id") REFERENCES "lantai"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jadwal_checklist" ADD CONSTRAINT "jadwal_checklist_kategori_id_fkey" FOREIGN KEY ("kategori_id") REFERENCES "kategori"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
