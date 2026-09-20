-- CreateIndex
CREATE UNIQUE INDEX "checklist_harian_tanggal_nama_tugas_lantai_id_ob_id_key" ON "checklist_harian"("tanggal", "nama_tugas", "lantai_id", "ob_id");
