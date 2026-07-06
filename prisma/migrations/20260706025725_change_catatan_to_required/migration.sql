/*
  Warnings:

  - Made the column `catatan` on table `histori_pekerjaan` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "histori_pekerjaan" ALTER COLUMN "catatan" SET NOT NULL;
