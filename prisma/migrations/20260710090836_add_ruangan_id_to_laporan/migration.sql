-- AlterTable: add ruangan_id to laporan_karyawan
ALTER TABLE "laporan_karyawan" ADD COLUMN "ruangan_id" UUID NOT NULL;

-- AddForeignKey
ALTER TABLE "laporan_karyawan" ADD CONSTRAINT "laporan_karyawan_ruangan_id_fkey" FOREIGN KEY ("ruangan_id") REFERENCES "ruangan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
