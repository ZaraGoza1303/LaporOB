import pg from "pg";
import bcrypt from "bcrypt";
import { randomUUID } from "crypto";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  console.log("Seeding database...");
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // ============ ROLE ============
    console.log("  Insert role...");
    await client.query(`
      INSERT INTO role (id, nama_role, created_at) VALUES
        ('dda2c23a-732c-41c5-80ee-b0818345fa25', 'admin',    now()),
        ('d25542e0-93ad-4513-87ca-c567319f6187', 'karyawan', now()),
        ('62c0a9d8-afd7-45f5-9cb3-6dc6e8a9b8da', 'ob',       now()),
        ('eb89b4f9-635f-4e1e-8916-3a96af4e0c72', 'hr',       now())
      ON CONFLICT (nama_role) DO NOTHING
    `);

    // ============ USER ============
    console.log("  Insert user...");
    const hashedPassword = await bcrypt.hash("password123", 10);
    await client.query(
      `
      INSERT INTO "user" (id, username, email, password, nama_lengkap, role_id, is_active, is_deleted, created_at, updated_at) VALUES
        ('7ad87697-6684-4d35-b691-eb8696fdcbdf', 'admin1',    'admin1@mail.com',    $1, 'Budi Santoso',     'dda2c23a-732c-41c5-80ee-b0818345fa25', true,  false, now(), now()),
        ('1faac01e-e059-4686-af13-f04bce031a71', 'karyawan1', 'karyawan1@mail.com', $1, 'Siti Aminah',      'd25542e0-93ad-4513-87ca-c567319f6187', true,  false, now(), now()),
        ('d2ecedca-a2aa-4aa4-a721-34d6703e530c', 'karyawan2', 'karyawan2@mail.com', $1, 'Andi Wijaya',      'd25542e0-93ad-4513-87ca-c567319f6187', true,  false, now(), now()),
        ('6fb8dfa8-92dc-4125-a00a-6ba9c6cd5820', 'ob1',       'ob1@mail.com',       $1, 'Joko Prasetyo',    '62c0a9d8-afd7-45f5-9cb3-6dc6e8a9b8da', true,  false, now(), now()),
        ('9e4d64c0-34e2-455c-b317-b9e4d6d5e6bd', 'ob2',       'ob2@mail.com',       $1, 'Rina Marlina',     '62c0a9d8-afd7-45f5-9cb3-6dc6e8a9b8da', true,  false, now(), now()),
        ('dc21d543-3890-4ffb-8b6d-b226c35ab8dc', 'ob3',       'ob3@mail.com',       $1, 'Dedi Kurniawan',   '62c0a9d8-afd7-45f5-9cb3-6dc6e8a9b8da', false, false, now(), now()),
        ('d5178486-b32e-414a-b927-04d96b150d1b', 'hr1',       'hr1@mail.com',       $1, 'Lestari Handayani','eb89b4f9-635f-4e1e-8916-3a96af4e0c72', true,  false, now(), now())
      ON CONFLICT (email) DO NOTHING
      `,
      [hashedPassword]
    );

    // ============ USER TOKEN ============
    console.log("  Insert user_token...");
    await client.query(`
      INSERT INTO user_token (id, user_id, token_hash, type, expired_at, used_at, created_at) VALUES
        ('bb6cb754-a862-4cd7-b6c0-8c1e097b942f', 'dc21d543-3890-4ffb-8b6d-b226c35ab8dc', 'a1b2c3d4e5f6token_verify_email_hash_dummy', 'VERIFY_EMAIL',    now() + interval '1 day',  NULL, now()),
        ('aad79c26-43c3-4486-a2d0-2dfea9f59b9d', '1faac01e-e059-4686-af13-f04bce031a71', 'z9y8x7w6v5u4token_reset_password_hash_dummy', 'RESET_PASSWORD', now() + interval '1 hour', now(), now())
      ON CONFLICT (token_hash) DO NOTHING
    `);

    // ============ LOKASI ============
    console.log("  Insert lokasi...");
    await client.query(`
      INSERT INTO lokasi (id, nama_lokasi, created_at, updated_at) VALUES
        ('033f0941-8378-42e3-af2c-29cf83ab8e11', 'Gedung A - Kantor Pusat',  now(), now()),
        ('6c58477b-a345-4175-893a-58472165b899', 'Gedung B - Kantor Cabang', now(), now())
      ON CONFLICT (id) DO NOTHING
    `);

    // ============ LANTAI ============
    console.log("  Insert lantai...");
    await client.query(`
      INSERT INTO lantai (id, lokasi_id, nomor_lantai, created_at, updated_at) VALUES
        ('45a8d4d0-ea99-404d-b35b-f39cd7315c2b', '033f0941-8378-42e3-af2c-29cf83ab8e11', 1, now(), now()),
        ('7249c72a-642d-4ceb-afbe-61396587e37e', '033f0941-8378-42e3-af2c-29cf83ab8e11', 2, now(), now()),
        ('a67fbf59-44e4-4537-a9b8-5c5193958116', '033f0941-8378-42e3-af2c-29cf83ab8e11', 3, now(), now()),
        ('5970908a-117c-4ab9-95f6-065ed4d8b04c', '6c58477b-a345-4175-893a-58472165b899', 1, now(), now()),
        ('a75e15c3-5990-4936-af85-2848d12d1901', '6c58477b-a345-4175-893a-58472165b899', 2, now(), now())
      ON CONFLICT (id) DO NOTHING
    `);

    // ============ RUANGAN ============
    console.log("  Insert ruangan...");
    await client.query(`
      INSERT INTO ruangan (id, lantai_id, nama, created_at, updated_at) VALUES
        -- Gedung A Lantai 1
        ('a8db3d11-447a-4c28-98e3-b0fc844e1e01', '45a8d4d0-ea99-404d-b35b-f39cd7315c2b', 'Lobby Gedung A', now(), now()),
        ('a8db3d11-447a-4c28-98e3-b0fc844e1e02', '45a8d4d0-ea99-404d-b35b-f39cd7315c2b', 'Toilet Pria Lantai 1', now(), now()),
        ('a8db3d11-447a-4c28-98e3-b0fc844e1e03', '45a8d4d0-ea99-404d-b35b-f39cd7315c2b', 'Toilet Wanita Lantai 1', now(), now()),
        ('a8db3d11-447a-4c28-98e3-b0fc844e1e04', '45a8d4d0-ea99-404d-b35b-f39cd7315c2b', 'Pantry Lantai 1', now(), now()),
        -- Gedung A Lantai 2
        ('a8db3d11-447a-4c28-98e3-b0fc844e2e01', '7249c72a-642d-4ceb-afbe-61396587e37e', 'Ruang Kerja Utama A2', now(), now()),
        ('a8db3d11-447a-4c28-98e3-b0fc844e2e02', '7249c72a-642d-4ceb-afbe-61396587e37e', 'Ruang Rapat Besar A2', now(), now()),
        ('a8db3d11-447a-4c28-98e3-b0fc844e2e03', '7249c72a-642d-4ceb-afbe-61396587e37e', 'Toilet Lantai 2', now(), now()),
        -- Gedung A Lantai 3
        ('a8db3d11-447a-4c28-98e3-b0fc844e3e01', 'a67fbf59-44e4-4537-a9b8-5c5193958116', 'Ruang Direksi', now(), now()),
        ('a8db3d11-447a-4c28-98e3-b0fc844e3e02', 'a67fbf59-44e4-4537-a9b8-5c5193958116', 'Ruang Server', now(), now()),
        ('a8db3d11-447a-4c28-98e3-b0fc844e3e03', 'a67fbf59-44e4-4537-a9b8-5c5193958116', 'Toilet Lantai 3', now(), now()),
        -- Gedung B Lantai 1
        ('b8db3d11-447a-4c28-98e3-b0fc844e1e01', '5970908a-117c-4ab9-95f6-065ed4d8b04c', 'Lobby Gedung B', now(), now()),
        ('b8db3d11-447a-4c28-98e3-b0fc844e1e02', '5970908a-117c-4ab9-95f6-065ed4d8b04c', 'Ruang Kerja Utama B1', now(), now()),
        ('b8db3d11-447a-4c28-98e3-b0fc844e1e03', '5970908a-117c-4ab9-95f6-065ed4d8b04c', 'Toilet Lantai 1', now(), now()),
        -- Gedung B Lantai 2
        ('b8db3d11-447a-4c28-98e3-b0fc844e2e01', 'a75e15c3-5990-4936-af85-2848d12d1901', 'Ruang Rapat B2', now(), now()),
        ('b8db3d11-447a-4c28-98e3-b0fc844e2e02', 'a75e15c3-5990-4936-af85-2848d12d1901', 'Pantry Lantai 2', now(), now()),
        ('b8db3d11-447a-4c28-98e3-b0fc844e2e03', 'a75e15c3-5990-4936-af85-2848d12d1901', 'Toilet Lantai 2', now(), now())
      ON CONFLICT (id) DO NOTHING
    `);

    // ============ KATEGORI ============
    console.log("  Insert kategori...");
    await client.query(`
      INSERT INTO kategori (id, nama_kategori, created_at, updated_at) VALUES
        ('ba7079f3-fc98-4be7-afe3-cc769ffa3458', 'Kebersihan',   now(), now()),
        ('d2597de5-120f-47b0-878a-83a46c47db34', 'Pengecekan',   now(), now()),
        ('5dcba45c-b5de-437c-858b-50dbe7624f9b', 'Peralatan',    now(), now())
      ON CONFLICT (id) DO NOTHING
    `);

    // ============ TUGAS ============
    console.log("  Insert tugas...");
    
    await client.query(`
      INSERT INTO tugas (id, kategori_id, nama_tugas, is_active, tanggal_selesai, created_at, updated_at) VALUES
        -- Kebersihan
        ('550fd576-3fd1-4a42-af0b-bb16c06436b2', 'ba7079f3-fc98-4be7-afe3-cc769ffa3458', 'Bersihkan lantai toilet', true, now() + interval '30 days', now(), now()),
        ('b8e4dd5c-227e-4650-bda5-ec630226a9d4', 'ba7079f3-fc98-4be7-afe3-cc769ffa3458', 'Sapu dan pel lantai ruangan', true, now() + interval '30 days', now(), now()),
        ('db8b6a86-3ac3-4cf7-bfc7-8fc72a368580', 'ba7079f3-fc98-4be7-afe3-cc769ffa3458', 'Lap meja dan kursi', true, now() + interval '30 days', now(), now()),
        ('695d2f29-7afe-47af-805e-bb47ddfd5c0b', 'ba7079f3-fc98-4be7-afe3-cc769ffa3458', 'Angkut & buang sampah ke TPS', true, now() + interval '30 days', now(), now()),
        -- Pengecekan
        ('d7d74511-f099-48ae-b357-6e3af2ccbde5', 'd2597de5-120f-47b0-878a-83a46c47db34', 'Cek kondisi wastafel & toilet', true, now() + interval '30 days', now(), now()),
        ('cb9b64e7-e59f-481b-a357-78e93719a4a9', 'd2597de5-120f-47b0-878a-83a46c47db34', 'Cek kondisi AC ruangan', true, now() + interval '30 days', now(), now())
      ON CONFLICT (id) DO NOTHING
    `);

    // ============ PENUGASAN OB ============
    console.log("  Insert penugasan_ob...");
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    await client.query(`
      INSERT INTO penugasan_ob (id, ob_id, lokasi_id, bulan, tahun, created_at, updated_at) VALUES
        ('${randomUUID()}', '6fb8dfa8-92dc-4125-a00a-6ba9c6cd5820', '033f0941-8378-42e3-af2c-29cf83ab8e11', ${currentMonth}, ${currentYear}, now(), now()),
        ('${randomUUID()}', '9e4d64c0-34e2-455c-b317-b9e4d6d5e6bd', '6c58477b-a345-4175-893a-58472165b899', ${currentMonth}, ${currentYear}, now(), now())
      ON CONFLICT (ob_id, lokasi_id, bulan, tahun) DO NOTHING
    `);

    // ============ CHECKLIST HARIAN ============
    console.log("  Insert checklist_harian...");
    // pakai komponen lokal karena toISOString bisa mundur sehari pas dini hari WIB
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    await client.query(`
      INSERT INTO checklist_harian (id, tanggal, nama_tugas, ob_id, lantai_id, kategori_id, status, created_at, updated_at) VALUES
        ('${randomUUID()}', '${todayStr}'::date, 'Bersihkan lantai toilet', '6fb8dfa8-92dc-4125-a00a-6ba9c6cd5820', '45a8d4d0-ea99-404d-b35b-f39cd7315c2b', 'ba7079f3-fc98-4be7-afe3-cc769ffa3458', 'BELUM_DIKERJAKAN', now(), now()),
        ('${randomUUID()}', '${todayStr}'::date, 'Sapu dan pel lantai ruangan', '6fb8dfa8-92dc-4125-a00a-6ba9c6cd5820', '45a8d4d0-ea99-404d-b35b-f39cd7315c2b', 'ba7079f3-fc98-4be7-afe3-cc769ffa3458', 'SEDANG_DIKERJAKAN', now(), now()),
        ('${randomUUID()}', '${todayStr}'::date, 'Lap meja dan kursi', '9e4d64c0-34e2-455c-b317-b9e4d6d5e6bd', '5970908a-117c-4ab9-95f6-065ed4d8b04c', 'ba7079f3-fc98-4be7-afe3-cc769ffa3458', 'BELUM_DIKERJAKAN', now(), now()),
        ('${randomUUID()}', '${todayStr}'::date, 'Angkut & buang sampah ke TPS', '9e4d64c0-34e2-455c-b317-b9e4d6d5e6bd', '5970908a-117c-4ab9-95f6-065ed4d8b04c', 'ba7079f3-fc98-4be7-afe3-cc769ffa3458', 'BELUM_DIKERJAKAN', now(), now())
      ON CONFLICT (tanggal, nama_tugas, lantai_id, ob_id) DO NOTHING
    `);

    // ============ LAPORAN KARYAWAN ============
    console.log("  Insert laporan_karyawan...");
    await client.query(`
      INSERT INTO laporan_karyawan (
        id, pelapor_id, ob_id, lantai_id, ruangan_id, kategori_id, 
        deskripsi_kendala, status, prioritas, foto_masalah, 
        is_approved, created_at, updated_at
      ) VALUES
        (
          'e1a0c1d2-3e4f-4a6b-8c7d-9e0f1a2b3c01',
          '1faac01e-e059-4686-af13-f04bce031a71',
          '6fb8dfa8-92dc-4125-a00a-6ba9c6cd5820',
          '45a8d4d0-ea99-404d-b35b-f39cd7315c2b',
          'a8db3d11-447a-4c28-98e3-b0fc844e1e02',
          'ba7079f3-fc98-4be7-afe3-cc769ffa3458',
          'Toilet pria lantai 1 kotor dan bau',
          'SELESAI',
          'URGENT',
          ARRAY['foto1.jpg', 'foto2.jpg'],
          true,
          now(),
          now()
        ),
        (
          'e2a0c1d2-3e4f-4a6b-8c7d-9e0f1a2b3c02',
          'd2ecedca-a2aa-4aa4-a721-34d6703e530c',
          '9e4d64c0-34e2-455c-b317-b9e4d6d5e6bd',
          '5970908a-117c-4ab9-95f6-065ed4d8b04c',
          'b8db3d11-447a-4c28-98e3-b0fc844e1e02',
          'd2597de5-120f-47b0-878a-83a46c47db34',
          'AC ruangan utama B1 tidak dingin',
          'PENDING',
          'STANDARD',
          ARRAY['ac_masalah.jpg'],
          false,
          now(),
          now()
        )
      ON CONFLICT (id) DO NOTHING
    `);

    // ============ APP SETTING ============
    console.log("  Insert app_setting...");
    await client.query(`
      INSERT INTO app_setting (id, key, value, type, created_at, updated_at) VALUES
        ('a1000000-0000-4000-8000-000000000001', 'app_name',    'LaporOB',        'text', now(), now()),
        ('a1000000-0000-4000-8000-000000000002', 'company_name', 'PT Lapor OB',    'text', now(), now()),
        ('a1000000-0000-4000-8000-000000000003', 'logo_url',    null,              'text', now(), now())
      ON CONFLICT (key) DO NOTHING
    `);

    // ============ SKILL DEFINITION ============
    console.log("  Insert skill_definition...");
    await client.query(`
      INSERT INTO skill_definition (id, nama_skill, keyword, deskripsi, is_auto, is_active, threshold, created_at, updated_at) VALUES
        ('b1a0c1d2-3e4f-4a6b-8c7d-9e0f1a2b3c4d', 'Perawatan AC', ARRAY['ac','pendingin','air conditioner','filter ac','remote ac','freon'], 'Merawat dan memperbaiki AC ruangan', true, true, 3, now(), now()),
        ('b2a0c1d2-3e4f-4a6b-8c7d-9e0f1a2b3c4e', 'Kebersihan Sanitasi', ARRAY['toilet','wc','kamar mandi','kloset','wastafel','urinoir','cermin toilet','sanitasi'], 'Membersihkan area sanitasi & kamar mandi', true, true, 5, now(), now()),
        ('b3a0c1d2-3e4f-4a6b-8c7d-9e0f1a2b3c4f', 'Perawatan Lantai', ARRAY['lantai','sapu','pel','menyapu','mengepel','keset','vinil','vynil','noda lantai'], 'Merawat kebersihan lantai', true, true, 5, now(), now()),
        ('b4a0c1d2-3e4f-4a6b-8c7d-9e0f1a2b3c50', 'Kebersihan Meja & Kursi', ARRAY['meja','kursi','lap meja','membersihkan meja'], 'Membersihkan meja dan kursi kerja', true, true, 5, now(), now()),
        ('b5a0c1d2-3e4f-4a6b-8c7d-9e0f1a2b3c51', 'Pengelolaan Sampah', ARRAY['sampah','tps','tong sampah','limbah','buang sampah','angkut sampah','kantong plastik sampah','recycle'], 'Mengelola dan membuang sampah', true, true, 5, now(), now()),
        ('b6a0c1d2-3e4f-4a6b-8c7d-9e0f1a2b3c52', 'Karyawan Teladan', ARRAY[]::text[], 'Penghargaan khusus dari admin', false, true, 0, now(), now())
      ON CONFLICT (id) DO NOTHING
    `);

    // ============ ACHIEVEMENT ============
    console.log("  Insert achievement...");
    await client.query(`
      INSERT INTO achievement (id, nama, deskripsi, tipe, keyword, threshold, response_time_threshold_seconds, icon, is_active, created_at, updated_at) VALUES
        ('c1a0c1d2-3e4f-4a6b-8c7d-9e0f1a2b3c01', 'Pekerja Keras', 'Menyelesaikan 50 tugas', 'COMPLETION_COUNT', ARRAY[]::text[], 50, null, null, true, now(), now()),
        ('c2a0c1d2-3e4f-4a6b-8c7d-9e0f1a2b3c02', 'Cepat Tanggap', 'Menyelesaikan 10 tugas dalam waktu 5 menit', 'FAST_RESPONSE', ARRAY[]::text[], 10, 300, null, true, now(), now())
      ON CONFLICT (id) DO NOTHING
    `);

    await client.query("COMMIT");
    console.log("✅ Seed Beres!");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Seed gagal:", err);
    throw err;
  } finally {
    client.release();
  }
}

main()
  .catch((e) => {
    console.error("Seed gagal:", e);
    process.exit(1);
  })
  .finally(() => pool.end());