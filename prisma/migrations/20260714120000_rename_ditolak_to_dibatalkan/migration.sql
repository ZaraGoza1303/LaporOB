-- Rename column ditolak_at -> dibatalkan_at (status const DITOLAK -> DIBATALKAN)
ALTER TABLE "laporan_karyawan" RENAME COLUMN "ditolak_at" TO "dibatalkan_at";

-- Align stored status value with the renamed const.
-- No-op when there are no DITOLAK rows (no seed data contains it).
UPDATE "laporan_karyawan" SET "status" = 'DIBATALKAN' WHERE "status" = 'DITOLAK';
