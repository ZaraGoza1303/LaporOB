-- AlterTable
ALTER TABLE "histori_pekerjaan" ADD COLUMN     "ob_id" UUID;

-- CreateTable
CREATE TABLE "kolaborasi_laporan" (
    "id" UUID NOT NULL,
    "laporan_id" UUID NOT NULL,
    "ob_id" UUID NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "kolaborasi_laporan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "kolaborasi_laporan_laporan_id_ob_id_key" ON "kolaborasi_laporan"("laporan_id", "ob_id");

-- AddForeignKey
ALTER TABLE "kolaborasi_laporan" ADD CONSTRAINT "kolaborasi_laporan_laporan_id_fkey" FOREIGN KEY ("laporan_id") REFERENCES "laporan_karyawan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kolaborasi_laporan" ADD CONSTRAINT "kolaborasi_laporan_ob_id_fkey" FOREIGN KEY ("ob_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "histori_pekerjaan" ADD CONSTRAINT "histori_pekerjaan_ob_id_fkey" FOREIGN KEY ("ob_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
