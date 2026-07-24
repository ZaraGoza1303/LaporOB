# Design: Field "alamat" pada Model Lokasi

## Ringkasan
Menambahkan field `alamat` (opsional/string) ke model `Lokasi` agar setiap lokasi bisa memiliki alamat lengkap.

## Perubahan

### Prisma Schema
- Model `Lokasi` ditambah field `alamat String? @db.VarChar(255)`

### DTO (`src/dto/lokasi.ts`)
- `CreateLokasiSchema`: tambah `alamat: z.string().trim().max(255).optional()`
- `UpdateLokasiSchema`: tambah `alamat: z.string().trim().max(255).optional()`
- `LokasiRes`: tambah field `alamat: string | null`

### Repository (`src/repositories/lokasi_repository.ts`)
- `insert()`: sertakan `alamat: req.alamat` di `tx.lokasi.create()`
- `update()`: tambah `if (req.alamat !== undefined)` untuk update alamat

### Service (`src/services/lokasi_service.ts`)
- `toResponse()`: mapping `alamat` dari item ke response

### Swagger (`swagger.yaml`)
- Tambah schema `LokasiRequest` dan `LokasiResponse` dengan field `alamat`
- Tambah path docs untuk CRUD lokasi jika belum ada

### Migration
- `npx prisma migrate dev --name add_alamat_to_lokasi`