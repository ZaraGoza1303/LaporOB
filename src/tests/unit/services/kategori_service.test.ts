import { beforeEach, describe, expect, it } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";
import { PrismaClient, Kategori } from "../../../generated/prisma/client";
import { KategoriRepository } from "../../../repositories/kategori_repository";
import { KategoriService } from "../../../services/kategori_service";
import type { IRedisClient } from "../../../database/redis.interface";

const mockDB = mockDeep<PrismaClient>();
const mockRedis = mockDeep<IRedisClient>();

const mockKategoriRepo = new KategoriRepository(mockDB);
const mockKategoriService = new KategoriService(mockKategoriRepo, mockRedis);

beforeEach(() => {
    mockReset(mockDB);
    mockReset(mockRedis);
});

const kategoriId = '3f2a1b7c-9d4e-4a51-8c6f-1d2e3f4a5b6c';

// Fungsi generate fake data dan bisa juga override
function createFakeKategori(overrides?: Partial<Kategori>): Kategori {
    return {
        id: kategoriId,
        nama_kategori: 'Kebersihan',
        created_at: new Date('2026-01-01T00:00:00Z'),
        updated_at: new Date('2026-01-01T00:00:00Z'),
        ...overrides,
    };
}

describe('KategoriService.getAll', () => {
    it('mengembalikan data kategori dari database dan menyimpannya ke cache jika cache kosong', async () => {
        const fakeKategoris = [createFakeKategori()];

        mockRedis.get.mockResolvedValue(null);
        mockDB.kategori.findMany.mockResolvedValue(fakeKategoris);

        const data = await mockKategoriService.getAll();

        expect(mockRedis.get).toHaveBeenCalledWith('kategori:all');
        expect(mockRedis.setEx).toHaveBeenCalledWith('kategori:all', 300, JSON.stringify(fakeKategoris));
        expect(data).toEqual(fakeKategoris);
    });

    it('mengembalikan data kategori dari cache dan tidak menyentuh database jika cache hit', async () => {
        const fakeKategoris = [createFakeKategori()];
        const cachedString = JSON.stringify(fakeKategoris);
        mockRedis.get.mockResolvedValue(cachedString);

        const data = await mockKategoriService.getAll();

        expect(data).toEqual(JSON.parse(cachedString));
        expect(mockDB.kategori.findMany).not.toHaveBeenCalled();
        expect(mockRedis.setEx).not.toHaveBeenCalled();
    });
});

describe('KategoriService.getByID', () => {
    it('mengembalikan detail kategori sesuai id', async () => {
        const fakeKategori = createFakeKategori();
        mockDB.kategori.findFirst.mockResolvedValue(fakeKategori);

        const data = await mockKategoriService.getByID(kategoriId);

        expect(mockDB.kategori.findFirst).toHaveBeenCalledWith({ where: { id: kategoriId } });
        expect(data).toEqual(fakeKategori);
    });

    it('mengembalikan null jika kategori tidak ditemukan', async () => {
        mockDB.kategori.findFirst.mockResolvedValue(null);

        const data = await mockKategoriService.getByID('kategori-not-exist');

        expect(data).toBeNull();
    });
});

describe('KategoriService.create', () => {
    it('membuat kategori baru tanpa menghapus cache', async () => {
        mockDB.kategori.create.mockResolvedValue(createFakeKategori());

        await mockKategoriService.create({ nama_kategori: 'Kebersihan' });

        expect(mockDB.kategori.create).toHaveBeenCalledWith({
            data: { nama_kategori: 'Kebersihan' },
        });
        expect(mockRedis.del).not.toHaveBeenCalled();
    });
});

describe('KategoriService.update', () => {
    it('mengupdate kategori dan menghapus cache', async () => {
        mockDB.kategori.update.mockResolvedValue(createFakeKategori());

        await mockKategoriService.update(kategoriId, { nama_kategori: 'Kebersihan Baru' });

        expect(mockDB.kategori.update).toHaveBeenCalledWith({
            where: { id: kategoriId },
            data: { nama_kategori: 'Kebersihan Baru' },
        });
        expect(mockRedis.del).toHaveBeenCalledWith('kategori:all');
    });
});

describe('KategoriService.delete', () => {
    it('menghapus kategori dan menghapus cache', async () => {
        mockDB.kategori.delete.mockResolvedValue(createFakeKategori());

        await mockKategoriService.delete(kategoriId);

        expect(mockDB.kategori.delete).toHaveBeenCalledWith({
            where: { id: kategoriId },
        });
        expect(mockRedis.del).toHaveBeenCalledWith('kategori:all');
    });
});

describe('KategoriService.getKategoriLimit', () => {
    it('mengembalikan kategori sebanyak limit yang diminta', async () => {
        const fakeKategoris = [createFakeKategori()];
        mockDB.kategori.findMany.mockResolvedValue(fakeKategoris);

        const data = await mockKategoriService.getKategoriLimit(5);

        expect(mockDB.kategori.findMany).toHaveBeenCalledWith({ take: 5 });
        expect(data).toEqual(fakeKategoris);
    });
});
