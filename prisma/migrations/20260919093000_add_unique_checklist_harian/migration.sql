-- Dedupe baris dobel sebelum bikin unique index:
-- sisakan 1 baris per (tanggal, nama_tugas, lantai_id, ob_id), yaitu yang id-nya paling kecil.
-- IS NOT DISTINCT FROM dipakai agar baris dengan ob_id NULL ikut ter-dedupe.
DELETE FROM "checklist_harian" a
USING "checklist_harian" b
WHERE a.id > b.id
  AND a.tanggal = b.tanggal
  AND a.nama_tugas = b.nama_tugas
  AND a.lantai_id = b.lantai_id
  AND a.ob_id IS NOT DISTINCT FROM b.ob_id;

-- CreateIndex
CREATE UNIQUE INDEX "checklist_harian_tanggal_nama_tugas_lantai_id_ob_id_key" ON "checklist_harian"("tanggal", "nama_tugas", "lantai_id", "ob_id");
