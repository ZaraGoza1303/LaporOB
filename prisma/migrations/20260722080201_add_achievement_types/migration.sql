-- AlterTable
ALTER TABLE "skill_definition" ADD COLUMN     "achievement_type" VARCHAR(30) NOT NULL DEFAULT 'KEYWORD',
ADD COLUMN     "response_time_threshold_seconds" INTEGER;
