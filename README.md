# LaporOB - Backend API Aplikasi Pelaporan OB

Repositori ini adalah bagian backend dari **LaporOB**, sebuah aplikasi pelaporan kendala kebersihan dan fasilitas kantor. Karyawan melaporkan kendala (misalnya ruangan kotor, AC bocor, atau fasilitas rusak), petugas OB (Office Boy) menindaklanjuti laporan dan mengerjakan checklist harian, sedangkan HR serta Admin mengelola data, memberi penugasan, dan memantau performa petugas.

Backend ini dibangun menggunakan ExpressJS dan TypeScript, dengan PostgreSQL sebagai basis data, Prisma sebagai ORM, dan Redis sebagai pendukung session serta rate limiting. Notifikasi dikirim secara real-time melalui WebSocket.

> Catatan: aplikasi ini masih dalam tahap pengembangan aktif, sehingga struktur, endpoint, dan aturan bisnis dapat berubah dari waktu ke waktu.

## Daftar Isi

- [Tentang Proyek](#tentang-proyek)

- [Tech Stack](#tech-stack)

- [Fitur Utama](#fitur-utama)

- [Persyaratan](#persyaratan)

- [Instalasi dan Menjalankan](#instalasi-dan-menjalankan)

- [Environment Variables](#environment-variables)

- [Struktur Proyek](#struktur-proyek)

- [Dokumentasi API](#dokumentasi-api)

- [Testing](#testing)

- [Kontributor](#kontributor)

- [Lisensi](#lisensi)

## Tentang Proyek

LaporOB mempertemukan dua sisi kebutuhan operasional kantor:

- **Sisi pelapor (karyawan):** membuat laporan kendala dengan deskripsi, foto, lokasi (lokasi, lantai, ruangan), dan kategori, lalu memantau status laporan.

- **Sisi pelaksana (OB):** menerima laporan, mengerjakan atau mengklaim laporan, mengajukan kolaborasi dengan OB lain, menyelesaikan tugas dan checklist harian, serta mengumpulkan skill dan achievement.

- **Sisi pengelola (HR dan Admin):** mengelola master data dan pengguna, memberi penugasan, menyetujui (approve) hasil pekerjaan, melihat performa dan ranking, serta mengekspor data ke Excel.

Aplikasi mengenal empat peran (role) pengguna: `admin`, `hr`, `karyawan`, dan `ob`. Setiap endpoint dilindungi oleh autentikasi JWT dan pembatasan peran.

## Tech Stack

| Teknologi | Keterangan |
| - | - |
| Express 5 | Framework web untuk Node.js |
| TypeScript | Bahasa pemrograman utama (mode ESM) |
| Prisma 6 | ORM dan manajemen migrasi basis data |
| PostgreSQL 15 | Basis data relasional |
| Redis | Penyimpanan session dan rate limiting |
| JSON Web Token | Autentikasi berbasis token |
| ws (WebSocket) | Notifikasi real-time |
| node-cron | Penjadwalan tugas otomatis (checklist harian, skill, achievement) |
| Multer, Sharp, file-type | Unggah dan validasi berkas gambar |
| Nodemailer, Mailtrap, EJS | Pengiriman email (aktivasi, reset password, perubahan password) |
| ExcelJS | Ekspor laporan ke Excel |
| Zod | Validasi skema request |
| Swagger (swagger-ui-express, yamljs) | Dokumentasi API interaktif |
| Vitest, Supertest | Pengujian unit dan integrasi |
| Docker dan Docker Compose | Containerisasi dan orkestrasi layanan |


## Fitur Utama

- **Autentikasi dan Akun:** aktivasi akun lewat email, login, logout, lupa password, reset password, ganti password, dan verifikasi token.

- **Manajemen Pengguna:** pengelolaan user untuk Admin dan HR, pembuatan akun, perpanjangan/pembaruan token, dan penugasan OB ke lokasi per periode (bulan dan tahun).

- **Master Data:** pengelolaan lokasi, lantai, ruangan, kategori, tugas, dan jadwal checklist.

- **Laporan dan Kolaborasi:** pembuatan laporan oleh karyawan, klaim dan pengerjaan oleh OB, permintaan bergabung (kolaborasi) antar OB, persetujuan atau penolakan, pembatalan laporan, serta histori pekerjaan.

- **Checklist Harian:** pembuatan checklist harian otomatis dari jadwal, klaim dan penyelesaian, serta persetujuan oleh Admin/HR.

- **Tugas OB:** daftar tugas, klaim tugas, penyelesaian tugas dengan foto awal dan foto akhir, serta proses persetujuan.

- **Skill dan Achievement:** definisi skill berbasis kata kunci, perolehan skill otomatis berdasarkan jumlah penyelesaian, dan pencapaian (achievement) termasuk berbasis waktu respons.

- **Notifikasi:** notifikasi dalam aplikasi dengan status baca, jumlah belum dibaca, dan pengiriman real-time melalui WebSocket.

- **Performa dan Ranking:** dashboard performa serta ranking OB dan karyawan untuk kebutuhan penilaian.

- **Ekspor Data:** ekspor data performa ke berkas Excel.

- **Pengaturan Aplikasi:** konfigurasi pengaturan aplikasi (key-value) dan data branding publik (misalnya nama aplikasi, nama perusahaan, dan logo).

## Persyaratan

- **Node.js** (versi 20 atau lebih baru; Dockerfile proyek ini memakai Node 26)

- **npm** (sudah termasuk dalam instalasi Node.js)

- **PostgreSQL 15** (bisa dijalankan lokal atau lewat Docker)

- **Redis**

- **Docker dan Docker Compose** (opsional, untuk menjalankan seluruh layanan sekaligus)

## Instalasi dan Menjalankan

### Opsi 1: Menjalankan dengan Docker

Mode development (menjalankan migrasi, seed, dan server dengan hot reload):

```
cp .env.example .env
# sesuaikan nilai pada .env bila perlu
docker compose up --build
```

Mode production:

```
cp .env.example .env
docker compose -f docker-compose.prod.yml up --build -d
```

Perintah di atas akan menjalankan tiga layanan: backend, PostgreSQL, dan Redis. Layanan backend otomatis menjalankan `prisma migrate deploy` sebelum server dinyalakan.

### Opsi 2: Menjalankan secara manual

1. Masuk ke direktori proyek.

```
cd LaporOB
```

2. Pasang dependensi.

```
npm install
```

3. Salin berkas environment dan sesuaikan nilainya.

```
cp .env.example .env
```

4. Siapkan basis data (generate client, jalankan migrasi, lalu isi data awal).

```
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
```

5. Jalankan server.

```
npm run dev
```

Server berjalan di `http://localhost:8000` (sesuai nilai `APP_PORT`). Dokumentasi API dapat diakses di `http://localhost:8000/api/docs`.

Untuk menjalankan versi hasil build:

```
npm run build
npm start
```

### Akun Contoh dari Seed

Data awal (`prisma/seed.ts`) menyertakan beberapa akun untuk pengujian. Semua akun memakai password `password123`.

| Email | Role | Status |
| - | - | - |
| [admin1@mail.com](mailto:admin1@mail.com) | admin | aktif |
| [hr1@mail.com](mailto:hr1@mail.com) | hr | aktif |
| [karyawan1@mail.com](mailto:karyawan1@mail.com) | karyawan | aktif |
| [karyawan2@mail.com](mailto:karyawan2@mail.com) | karyawan | aktif |
| [ob1@mail.com](mailto:ob1@mail.com) | ob | aktif |
| [ob2@mail.com](mailto:ob2@mail.com) | ob | aktif |
| [ob3@mail.com](mailto:ob3@mail.com) | ob | belum aktif |


## Environment Variables

Salin `.env.example` menjadi `.env`, lalu sesuaikan nilainya. Variabel utama yang digunakan:

| Variabel | Deskripsi |
| - | - |
| APP\_NAME | Nama aplikasi (misalnya LaporOB) |
| COMPANY\_NAME | Nama perusahaan yang tampil pada aplikasi |
| LOGO\_URL | Path atau URL logo aplikasi |
| APP\_PORT | Port server backend (default 8000) |
| TZ | Zona waktu server (misalnya Asia/Jakarta) |
| DATABASE\_URL | String koneksi PostgreSQL untuk Prisma |
| POSTGRES\_USER | Username PostgreSQL |
| POSTGRES\_PASSWORD | Password PostgreSQL |
| POSTGRES\_DB | Nama basis data PostgreSQL |
| JWT\_TOKEN | Secret untuk menandatangani token JWT |
| BACKEND\_BASE\_URL | URL dasar backend |
| FRONTEND\_BASE\_URL | URL dasar frontend |
| STORAGE\_PROVIDER | Penyimpanan berkas: `local` atau `cloud` |
| CLOUD\_UPLOAD\_URL | URL layanan penyimpanan cloud (bila `STORAGE_PROVIDER=cloud`) |
| CLOUD\_UPLOAD\_API\_KEY | API key penyimpanan cloud (bila `STORAGE_PROVIDER=cloud`) |
| REDIS\_URL | String koneksi Redis |
| REDIS\_PASSWORD | Password Redis |
| EMAIL\_DRIVER | Driver email (misalnya gmail atau mailtrap) |
| EMAIL\_PORT | Port SMTP |
| SMTP\_HOST | Host SMTP |
| SMTP\_USER | Username SMTP |
| SMTP\_PASS | Password SMTP |
| MAILTRAP\_HOST | Host Mailtrap (untuk pengujian email) |
| MAILTRAP\_API\_KEY | API key Mailtrap |
| MAILTRAP\_SENDER | Alamat pengirim pada Mailtrap |
| MAILTRAP\_INBOX\_ID | ID inbox Mailtrap |


> Jangan pernah mengunggah berkas `.env` berisi nilai asli ke repositori. Berkas tersebut sudah tercantum pada `.gitignore`.

## Struktur Proyek

```
LaporOB/
├── prisma/                 # schema, migrasi, dan seed basis data
├── src/
│   ├── controllers/        # penanganan request dan response
│   ├── services/           # logika bisnis aplikasi
│   ├── repositories/       # akses data ke basis data
│   ├── routes/             # definisi endpoint per modul
│   ├── middleware/         # autentikasi JWT, pembatasan role, rate limiter
│   ├── dto/                # skema validasi request
│   ├── database/           # koneksi PostgreSQL dan Redis
│   ├── cron/               # penjadwalan tugas otomatis
│   ├── email/              # template email (EJS)
│   ├── generated/          # Prisma client hasil generate
│   ├── utils/              # utilitas (response, error, tanggal, dan lain-lain)
│   ├── tests/              # pengujian unit dan integrasi
│   ├── container.ts        # dependency injection (repository, service, controller)
│   └── index.ts            # entrypoint aplikasi
├── swagger.yaml            # spesifikasi OpenAPI
├── docker-compose.yml      # konfigurasi Docker untuk development
├── docker-compose.prod.yml # konfigurasi Docker untuk production
├── Dockerfile              # image production
├── Dockerfile.dev          # image development
└── package.json
```

Arsitektur aplikasi mengikuti pola berlapis: `routes` memanggil `controllers`, `controllers` memanggil `services` yang berisi logika bisnis, dan `services` memanggil `repositories` untuk mengakses basis data melalui Prisma. Ketergantungan antar lapisan dirakit pada `src/container.ts`.

## Dokumentasi API

Dokumentasi interaktif (Swagger UI) tersedia saat server berjalan di:

```
http://localhost:8000/api/docs
```

Spesifikasi OpenAPI lengkap tersimpan pada berkas `swagger.yaml`. Sebagian besar endpoint memerlukan header `Authorization: Bearer <token>` yang diperoleh dari proses login.

Prefix endpoint yang tersedia dikelompokkan sebagai berikut:

| Prefix | Cakupan |
| - | - |
| `/api/auth` | Autentikasi: login, aktivasi akun, logout, lupa/reset/ganti password |
| `/api/user` | Profil pengguna yang sedang login |
| `/api/admin` | Statistik, persetujuan tugas dan checklist, penugasan OB, dan pengelolaan laporan |
| `/api/admin/settings` | Pengaturan aplikasi (key-value) |
| `/api/hr` | Pengelolaan pengguna, performa, laporan, tugas, dan checklist untuk HR/Admin |
| `/api/karyawan` | Dashboard karyawan dan pembuatan laporan |
| `/api/ob` | Dashboard OB dan kolaborasi laporan |
| `/api/ob/laporan` | Pengerjaan dan pembatalan laporan oleh OB |
| `/api/ob/tugas` | Daftar, klaim, dan penyelesaian tugas OB |
| `/api/lokasi` | Master data lokasi |
| `/api/lantai` | Master data lantai |
| `/api/ruangan` | Master data ruangan |
| `/api/kategori` | Master data kategori |
| `/api/tugas` | Master data tugas |
| `/api/jadwal-checklist` | Master data jadwal checklist |
| `/api/checklist-harian` | Checklist harian |
| `/api/skill` | Definisi dan perolehan skill |
| `/api/achievement` | Definisi dan perolehan achievement |
| `/api/notifikasi` | Daftar, jumlah belum dibaca, dan status baca notifikasi |
| `/api/constants` | Daftar konstanta (status, prioritas, dan lain-lain) |
| `/api/roles` | Daftar role pengguna |
| `/api/settings` | Pengaturan publik dan branding aplikasi |
| `/api/export` | Ekspor data (Excel) |


Endpoint yang diawali `/api/admin`, `/api/hr`, dan sebagian `/api/ob` dibatasi berdasarkan role pengguna.

## Testing

Pengujian menggunakan Vitest dan Supertest, dengan lokasi berkas di `src/tests/unit` dan `src/tests/integration`.

```
# Menjalankan seluruh pengujian
npm test

# Hanya pengujian unit
npm run test:unit

# Hanya pengujian integrasi
npm run test:integration

# Mode watch
npm run test:watch

# Dengan laporan cakupan (coverage)
npm run test:coverage
```

## Kontributor

Terima kasih kepada pihak yang telah berkontribusi pada pengembangan repositori ini:

- ZaraGoza1303

- FlintHassel

- AdityaPratama2824

- pkl\_wgs

## Lisensi

Proyek ini dilisensikan di bawah lisensi **ISC** (lihat `package.json`).

## Status Proyek

Proyek ini sedang dalam pengembangan aktif. Perubahan pada struktur kode, basis data, dan endpoint dapat terjadi seiring penambahan dan penyempurnaan fitur.

