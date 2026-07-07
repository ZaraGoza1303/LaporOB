-- DropForeignKey
ALTER TABLE "histori_pekerjaan" DROP CONSTRAINT "histori_pekerjaan_laporan_karyawan_id_fkey";

-- DropForeignKey
ALTER TABLE "lantai" DROP CONSTRAINT "lantai_lokasi_id_fkey";

-- DropForeignKey
ALTER TABLE "ruangan" DROP CONSTRAINT "ruangan_lantai_id_fkey";

-- DropForeignKey
ALTER TABLE "tugas" DROP CONSTRAINT "tugas_kategori_id_fkey";

-- DropForeignKey
ALTER TABLE "user_token" DROP CONSTRAINT "user_token_user_id_fkey";

-- AddForeignKey
ALTER TABLE "user_token" ADD CONSTRAINT "user_token_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lantai" ADD CONSTRAINT "lantai_lokasi_id_fkey" FOREIGN KEY ("lokasi_id") REFERENCES "lokasi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ruangan" ADD CONSTRAINT "ruangan_lantai_id_fkey" FOREIGN KEY ("lantai_id") REFERENCES "lantai"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tugas" ADD CONSTRAINT "tugas_kategori_id_fkey" FOREIGN KEY ("kategori_id") REFERENCES "kategori"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "histori_pekerjaan" ADD CONSTRAINT "histori_pekerjaan_laporan_karyawan_id_fkey" FOREIGN KEY ("laporan_karyawan_id") REFERENCES "laporan_karyawan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
