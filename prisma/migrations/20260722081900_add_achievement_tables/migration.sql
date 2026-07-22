-- Drop columns moved to achievement
ALTER TABLE "skill_definition" DROP COLUMN "achievement_type",
DROP COLUMN "response_time_threshold_seconds";

-- CreateTable
CREATE TABLE "achievement" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nama" VARCHAR(100) NOT NULL,
    "deskripsi" TEXT,
    "tipe" VARCHAR(30) NOT NULL DEFAULT 'KEYWORD',
    "keyword" TEXT[] DEFAULT ARRAY[]::TEXT[] NOT NULL,
    "threshold" INTEGER NOT NULL DEFAULT 5,
    "response_time_threshold_seconds" INTEGER,
    "icon" VARCHAR(255),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ob_achievement" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ob_id" UUID NOT NULL,
    "achievement_id" UUID NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "diperoleh_at" TIMESTAMP(6),

    CONSTRAINT "ob_achievement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ob_achievement_ob_id_idx" ON "ob_achievement"("ob_id");
CREATE INDEX "ob_achievement_achievement_id_idx" ON "ob_achievement"("achievement_id");

-- CreateIndex
CREATE UNIQUE INDEX "ob_achievement_ob_id_achievement_id_key" ON "ob_achievement"("ob_id", "achievement_id");

-- AddForeignKey
ALTER TABLE "ob_achievement" ADD CONSTRAINT "ob_achievement_ob_id_fkey" FOREIGN KEY ("ob_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ob_achievement" ADD CONSTRAINT "ob_achievement_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "achievement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
