-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nama_lengkap" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role" (
    "id" TEXT NOT NULL,
    "nama_role" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lokasi" (
    "id" TEXT NOT NULL,
    "nama_lokasi" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lokasi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lantai" (
    "id" TEXT NOT NULL,
    "lokasi_id" TEXT NOT NULL,
    "nomor_lantai" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lantai_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kategori" (
    "id" TEXT NOT NULL,
    "nama_kategori" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kategori_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tugas" (
    "id" TEXT NOT NULL,
    "kategori_id" TEXT NOT NULL,
    "nama_tugas" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tugas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_harian" (
    "id" TEXT NOT NULL,
    "tanggal" DATE NOT NULL,
    "ob_id" TEXT NOT NULL,
    "lantai_id" TEXT NOT NULL,
    "kategori_id" TEXT NOT NULL,
    "tugas_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checklist_harian_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "laporan_karyawan" (
    "id" TEXT NOT NULL,
    "pelapor_id" TEXT NOT NULL,
    "ob_id" TEXT,
    "lantai_id" TEXT NOT NULL,
    "kategori_id" TEXT NOT NULL,
    "deskripsi_kendala" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "foto_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "laporan_karyawan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "histori_pekerjaan" (
    "id" TEXT NOT NULL,
    "laporan_karyawan_id" TEXT NOT NULL,
    "ob_id" TEXT NOT NULL,
    "status_aksi" TEXT NOT NULL,
    "keterangan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "histori_pekerjaan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");

-- CreateIndex
CREATE UNIQUE INDEX "role_nama_role_key" ON "role"("nama_role");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lantai" ADD CONSTRAINT "lantai_lokasi_id_fkey" FOREIGN KEY ("lokasi_id") REFERENCES "lokasi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tugas" ADD CONSTRAINT "tugas_kategori_id_fkey" FOREIGN KEY ("kategori_id") REFERENCES "kategori"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tugas" ADD CONSTRAINT "tugas_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_harian" ADD CONSTRAINT "checklist_harian_ob_id_fkey" FOREIGN KEY ("ob_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_harian" ADD CONSTRAINT "checklist_harian_lantai_id_fkey" FOREIGN KEY ("lantai_id") REFERENCES "lantai"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_harian" ADD CONSTRAINT "checklist_harian_kategori_id_fkey" FOREIGN KEY ("kategori_id") REFERENCES "kategori"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_harian" ADD CONSTRAINT "checklist_harian_tugas_id_fkey" FOREIGN KEY ("tugas_id") REFERENCES "tugas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "laporan_karyawan" ADD CONSTRAINT "laporan_karyawan_pelapor_id_fkey" FOREIGN KEY ("pelapor_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "laporan_karyawan" ADD CONSTRAINT "laporan_karyawan_ob_id_fkey" FOREIGN KEY ("ob_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "laporan_karyawan" ADD CONSTRAINT "laporan_karyawan_lantai_id_fkey" FOREIGN KEY ("lantai_id") REFERENCES "lantai"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "laporan_karyawan" ADD CONSTRAINT "laporan_karyawan_kategori_id_fkey" FOREIGN KEY ("kategori_id") REFERENCES "kategori"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "histori_pekerjaan" ADD CONSTRAINT "histori_pekerjaan_laporan_karyawan_id_fkey" FOREIGN KEY ("laporan_karyawan_id") REFERENCES "laporan_karyawan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "histori_pekerjaan" ADD CONSTRAINT "histori_pekerjaan_ob_id_fkey" FOREIGN KEY ("ob_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
