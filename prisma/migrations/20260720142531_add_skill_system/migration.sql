-- CreateTable
CREATE TABLE "skill_definition" (
    "id" UUID NOT NULL,
    "nama_skill" VARCHAR(100) NOT NULL,
    "keyword" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "deskripsi" TEXT,
    "is_auto" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "threshold" INTEGER NOT NULL DEFAULT 5,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "skill_definition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ob_skill" (
    "id" UUID NOT NULL,
    "ob_id" UUID NOT NULL,
    "skill_id" UUID NOT NULL,
    "jumlah_selesai" INTEGER NOT NULL DEFAULT 0,
    "assigned_by" UUID,
    "diperoleh_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "ob_skill_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ob_skill_ob_id_skill_id_key" ON "ob_skill"("ob_id", "skill_id");

-- AddForeignKey
ALTER TABLE "ob_skill" ADD CONSTRAINT "ob_skill_ob_id_fkey" FOREIGN KEY ("ob_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ob_skill" ADD CONSTRAINT "ob_skill_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skill_definition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
