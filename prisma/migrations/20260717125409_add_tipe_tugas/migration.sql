-- CreateEnum
CREATE TYPE "TipeTugas" AS ENUM ('SEKALI', 'HARIAN');

-- AlterTable
ALTER TABLE "tugas" ADD COLUMN     "catatan" TEXT,
ADD COLUMN     "dikerjakan_at" TIMESTAMP(6),
ADD COLUMN     "lantai_id" UUID,
ADD COLUMN     "ob_id" UUID,
ADD COLUMN     "selesai_at" TIMESTAMP(6),
ADD COLUMN     "status" VARCHAR(30),
ADD COLUMN     "terlewat_at" TIMESTAMP(6),
ADD COLUMN     "tipe" "TipeTugas" DEFAULT 'HARIAN';

-- AddForeignKey
ALTER TABLE "tugas" ADD CONSTRAINT "tugas_ob_id_fkey" FOREIGN KEY ("ob_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tugas" ADD CONSTRAINT "tugas_lantai_id_fkey" FOREIGN KEY ("lantai_id") REFERENCES "lantai"("id") ON DELETE SET NULL ON UPDATE CASCADE;
