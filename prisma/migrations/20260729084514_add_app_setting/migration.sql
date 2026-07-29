-- CreateTable
CREATE TABLE "app_setting" (
    "id" UUID NOT NULL,
    "key" VARCHAR(50) NOT NULL,
    "value" TEXT,
    "type" VARCHAR(20) NOT NULL DEFAULT 'text',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "app_setting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "app_setting_key_key" ON "app_setting"("key");
