-- AlterTable: add timestamps to ob_achievement
ALTER TABLE "ob_achievement" ADD COLUMN "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "ob_achievement" ADD COLUMN "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;
