-- AlterTable
ALTER TABLE "checklist_harian" ADD COLUMN     "approved_at" TIMESTAMP(6),
ADD COLUMN     "is_approved" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "tugas" ADD COLUMN     "approved_at" TIMESTAMP(6),
ADD COLUMN     "is_approved" BOOLEAN NOT NULL DEFAULT false;
