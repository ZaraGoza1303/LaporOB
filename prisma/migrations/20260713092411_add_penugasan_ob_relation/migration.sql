/*
  Warnings:

  - You are about to drop the column `lokasi_id` on the `user` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "user" DROP CONSTRAINT "user_lokasi_id_fkey";

-- AlterTable
ALTER TABLE "user" DROP COLUMN "lokasi_id";

-- CreateTable
CREATE TABLE "penugasan_ob" (
    "id" UUID NOT NULL,
    "ob_id" UUID NOT NULL,
    "lokasi_id" UUID NOT NULL,
    "bulan" INTEGER NOT NULL,
    "tahun" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "penugasan_ob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "penugasan_ob_ob_id_lokasi_id_bulan_tahun_key" ON "penugasan_ob"("ob_id", "lokasi_id", "bulan", "tahun");

-- AddForeignKey
ALTER TABLE "penugasan_ob" ADD CONSTRAINT "penugasan_ob_ob_id_fkey" FOREIGN KEY ("ob_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penugasan_ob" ADD CONSTRAINT "penugasan_ob_lokasi_id_fkey" FOREIGN KEY ("lokasi_id") REFERENCES "lokasi"("id") ON DELETE CASCADE ON UPDATE CASCADE;
