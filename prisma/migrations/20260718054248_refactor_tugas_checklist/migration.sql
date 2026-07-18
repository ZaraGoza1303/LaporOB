-- Drop foreign key constraints referencing columns being dropped
ALTER TABLE "tugas" DROP CONSTRAINT IF EXISTS "tugas_lantai_id_fkey";
ALTER TABLE "tugas" DROP CONSTRAINT IF EXISTS "tugas_ob_id_fkey";

-- Drop columns from tugas table
ALTER TABLE "tugas" DROP COLUMN IF EXISTS "tipe";
ALTER TABLE "tugas" DROP COLUMN IF EXISTS "ob_id";
ALTER TABLE "tugas" DROP COLUMN IF EXISTS "lantai_id";
ALTER TABLE "tugas" DROP COLUMN IF EXISTS "status";
ALTER TABLE "tugas" DROP COLUMN IF EXISTS "catatan";
ALTER TABLE "tugas" DROP COLUMN IF EXISTS "dikerjakan_at";
ALTER TABLE "tugas" DROP COLUMN IF EXISTS "selesai_at";
ALTER TABLE "tugas" DROP COLUMN IF EXISTS "terlewat_at";

-- Drop the enum type
DROP TYPE IF EXISTS "TipeTugas";

-- Add auto_generate to checklist_harian
ALTER TABLE "checklist_harian" ADD COLUMN IF NOT EXISTS "auto_generate" BOOLEAN NOT NULL DEFAULT true;
