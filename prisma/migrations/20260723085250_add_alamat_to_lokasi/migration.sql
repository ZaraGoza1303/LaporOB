-- DropIndex
DROP INDEX "ob_achievement_achievement_id_idx";

-- DropIndex
DROP INDEX "ob_achievement_ob_id_idx";

-- AlterTable
ALTER TABLE "achievement" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "lokasi" ADD COLUMN     "alamat" VARCHAR(255);

-- AlterTable
ALTER TABLE "ob_achievement" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "diperoleh_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" DROP DEFAULT;
