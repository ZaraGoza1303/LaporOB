-- Drop FK constraint linking checklist_harian to tugas
ALTER TABLE "checklist_harian" DROP CONSTRAINT IF EXISTS "checklist_harian_tugas_id_fkey";

-- Drop the tugas_id column (FK is gone)
ALTER TABLE "checklist_harian" DROP COLUMN IF EXISTS "tugas_id";

-- Add nama_tugas as a direct string field
ALTER TABLE "checklist_harian" ADD COLUMN "nama_tugas" VARCHAR(150) NOT NULL DEFAULT '';
