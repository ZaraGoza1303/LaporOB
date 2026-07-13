-- AlterTable
ALTER TABLE "user" ADD COLUMN     "lokasi_id" UUID;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_lokasi_id_fkey" FOREIGN KEY ("lokasi_id") REFERENCES "lokasi"("id") ON DELETE SET NULL ON UPDATE CASCADE;
