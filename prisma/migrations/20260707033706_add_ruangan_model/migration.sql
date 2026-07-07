-- CreateTable
CREATE TABLE "ruangan" (
    "id" UUID NOT NULL,
    "lantai_id" UUID NOT NULL,
    "nama" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "ruangan_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ruangan" ADD CONSTRAINT "ruangan_lantai_id_fkey" FOREIGN KEY ("lantai_id") REFERENCES "lantai"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
