-- Notifikasi dari sistem tidak punya pengirim user, jadi pengirim_id boleh NULL (NULL = sistem)
ALTER TABLE "notifikasi" ALTER COLUMN "pengirim_id" DROP NOT NULL;
