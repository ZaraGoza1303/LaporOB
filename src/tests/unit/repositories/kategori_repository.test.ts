import { beforeEach, describe, expect, it } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';
import { PrismaClient, Kategori } from '../../../generated/prisma/client.js';
import { KategoriRepository } from '../../../repositories/kategori_repository.js';

const mockDB = mockDeep<PrismaClient>();
const mockKategoriRepo = new KategoriRepository(mockDB);

beforeEach(() => {
    mockReset(mockDB);
});

// Fungsi generate fake data dan bisa juga override
function createFakeKategori(overrides?: Partial<Kategori>): Kategori {
    return {
        id: '3f2a1b7c-9d4e-4a51-8c6f-1d2e3f4a5b6c',
        nama_kategori: 'Kebersihan',
        created_at: new Date('2026-01-01T00:00:00Z'),
        updated_at: new Date('2026-01-01T00:00:00Z'),
        ...overrides,
    };
}

describe('KategoriRepository.getAll', () => {
    it('mengembalikan semua kategori', async () => {
        const fakeKategoris = [
            createFakeKategori(),
            createFakeKategori({ id: 'f6e0481d-67d4-449b-b3dc-376e72bdcf28', nama_kategori: 'Keamanan' }),
        ];
        mockDB.kategori.findMany.mockResolvedValue(fakeKategoris);

        const data = await mockKategoriRepo.getAll();

        expect(mockDB.kategori.findMany).toHaveBeenCalledWith();
        expect(data).toEqual(fakeKategoris);
    });

    it('mengembalikan array kosong jika belum ada kategori', async () => {
        mockDB.kategori.findMany.mockResolvedValue([]);

        const data = await mockKategoriRepo.getAll();

        expect(data).toEqual([]);
    });
});

describe('KategoriRepository.getByID', () => {
    it('mengembalikan kategori sesuai id yang dikirim', async () => {
        const fakeKategori = createFakeKategori();
        mockDB.kategori.findFirst.mockResolvedValue(fakeKategori);

        const data = await mockKategoriRepo.getByID(fakeKategori.id);

        expect(mockDB.kategori.findFirst).toHaveBeenCalledWith({ where: { id: fakeKategori.id } });
        expect(data).toEqual(fakeKategori);
    });

    it('mengembalikan null jika kategori tidak ditemukan', async () => {
        mockDB.kategori.findFirst.mockResolvedValue(null);

        const data = await mockKategoriRepo.getByID('kategori-not-exist');

        expect(data).toBeNull();
    });
});

describe('KategoriRepository.insert', () => {
    it('membuat kategori baru dengan data yang dikirim', async () => {
        const req = { nama_kategori: 'Kebersihan' };

        await mockKategoriRepo.insert(req);

        expect(mockDB.kategori.create).toHaveBeenCalledWith({ data: req });
    });
});

describe('KategoriRepository.update', () => {
    it('mengupdate kategori sesuai id dan data yang dikirim', async () => {
        const kategoriId = '3f2a1b7c-9d4e-4a51-8c6f-1d2e3f4a5b6c';

        await mockKategoriRepo.update(kategoriId, { nama_kategori: 'Kebersihan Lanjutan' });

        expect(mockDB.kategori.update).toHaveBeenCalledWith({
            where: { id: kategoriId },
            data: { nama_kategori: 'Kebersihan Lanjutan' },
        });
    });
});

describe('KategoriRepository.delete', () => {
    it('menghapus kategori sesuai id yang dikirim', async () => {
        const kategoriId = '3f2a1b7c-9d4e-4a51-8c6f-1d2e3f4a5b6c';

        await mockKategoriRepo.delete(kategoriId);

        expect(mockDB.kategori.delete).toHaveBeenCalledWith({
            where: { id: kategoriId },
        });
    });
});

describe('KategoriRepository.getKategoriLimit', () => {
    it('mengembalikan kategori sebanyak limit yang diminta', async () => {
        const fakeKategoris = [createFakeKategori(), createFakeKategori({ id: 'f6e0481d-67d4-449b-b3dc-376e72bdcf28' })];
        mockDB.kategori.findMany.mockResolvedValue(fakeKategoris);

        const data = await mockKategoriRepo.getKategoriLimit(2);

        expect(mockDB.kategori.findMany).toHaveBeenCalledWith({ take: 2 });
        expect(data).toEqual(fakeKategoris);
    });
});
