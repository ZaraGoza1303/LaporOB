-- CreateTable
CREATE TABLE "notifikasi" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "pengirim_id" UUID,
    "tipe" VARCHAR(50) NOT NULL,
    "judul" VARCHAR(200) NOT NULL,
    "pesan" TEXT,
    "ref_id" VARCHAR(100),
    "ref_tipe" VARCHAR(50),
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifikasi_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "notifikasi" ADD CONSTRAINT "notifikasi_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifikasi" ADD CONSTRAINT "notifikasi_pengirim_id_fkey" FOREIGN KEY ("pengirim_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
