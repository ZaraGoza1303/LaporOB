-- AlterTable
ALTER TABLE "checklist_harian" ADD COLUMN     "dikerjakan_at" TIMESTAMP(6),
ADD COLUMN     "selesai_at" TIMESTAMP(6),
ADD COLUMN     "terlewat_at" TIMESTAMP(6);
