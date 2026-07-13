-- AlterTable
ALTER TABLE "laporan_karyawan" ADD COLUMN     "admin_catatan" TEXT,
ADD COLUMN     "finished_at" TIMESTAMP(6),
ADD COLUMN     "ongoing_at" TIMESTAMP(6),
ADD COLUMN     "pending_at" TIMESTAMP(6),
ADD COLUMN     "rejected_at" TIMESTAMP(6),
ADD COLUMN     "started_at" TIMESTAMP(6);
