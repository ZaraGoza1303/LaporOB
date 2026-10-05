import { beforeEach, describe, expect, it } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';
import { PrismaClient, Lantai } from '../../../generated/prisma/client.js';
import { LantaiRepository } from '../../../repositories/lantai_repository.js';

const mockDB = mockDeep<PrismaClient>();
const mockLantaiRepo = new LantaiRepository(mockDB);

beforeEach(() => {
    mockReset(mockDB);
});

const lokasiId = 'e2fbdc6f-ec0d-4547-a51d-a81b69741ed2';
const lantaiId = '3f2a1b7c-9d4e-4a51-8c6f-1d2e3f4a5b6c';

// Fungsi generate fake data dan bisa juga override
function createFakeLantai(overrides?: Partial<Lantai>): Lantai {
    return {
        id: lantaiId,
        lokasi_id: lokasiId,
        nomor_lantai: 1,
        created_at: new Date('2026-01-01T00:00:00Z'),
        updated_at: new Date('2026-01-01T00:00:00Z'),
        ...overrides,
    };
}

describe('LantaiRepository.getAll', () => {
    it('mengembalikan semua lantai jika lokasi_id tidak dikirim', async () => {
        const fakeLantais = [createFakeLantai(), createFakeLantai({ id: 'f6e0481d-67d4-449b-b3dc-376e72bdcf28', nomor_lantai: 2 })];
        mockDB.lantai.findMany.mockResolvedValue(fakeLantais);

        const data = await mockLantaiRepo.getAll();

        expect(mockDB.lantai.findMany).toHaveBeenCalledWith({ where: {} });
        expect(data).toEqual(fakeLantais);
    });

    it('mengembalikan lantai sesuai lokasi_id yang dikirim', async () => {
        const fakeLantais = [createFakeLantai()];
        mockDB.lantai.findMany.mockResolvedValue(fakeLantais);

        const data = await mockLantaiRepo.getAll(lokasiId);

        expect(mockDB.lantai.findMany).toHaveBeenCalledWith({ where: { lokasi_id: lokasiId } });
        expect(data).toEqual(fakeLantais);
    });
});

describe('LantaiRepository.getById', () => {
    it('mengembalikan lantai sesuai id jika lokasi_id tidak dikirim', async () => {
        const fakeLantai = createFakeLantai();
        mockDB.lantai.findFirst.mockResolvedValue(fakeLantai);

        const data = await mockLantaiRepo.getById(undefined, lantaiId);

        expect(mockDB.lantai.findFirst).toHaveBeenCalledWith({ where: { id: lantaiId } });
        expect(data).toEqual(fakeLantai);
    });

    it('mengembalikan lantai sesuai id dan lokasi_id yang dikirim', async () => {
        const fakeLantai = createFakeLantai();
        mockDB.lantai.findFirst.mockResolvedValue(fakeLantai);

        const data = await mockLantaiRepo.getById(lokasiId, lantaiId);

        expect(mockDB.lantai.findFirst).toHaveBeenCalledWith({
            where: { id: lantaiId, lokasi_id: lokasiId },
        });
        expect(data).toEqual(fakeLantai);
    });

    it('mengembalikan null jika lantai tidak ditemukan', async () => {
        mockDB.lantai.findFirst.mockResolvedValue(null);

        const data = await mockLantaiRepo.getById(lokasiId, 'lantai-not-exist');

        expect(data).toBeNull();
    });
});

describe('LantaiRepository.insert', () => {
    it('membuat lantai baru dengan data yang dikirim', async () => {
        const req = {
            lokasi: { connect: { id: lokasiId } },
            nomor_lantai: 3,
        };

        await mockLantaiRepo.insert(req);

        expect(mockDB.lantai.create).toHaveBeenCalledWith({ data: req });
    });
});

describe('LantaiRepository.update', () => {
    it('mengupdate lantai sesuai id dan data yang dikirim', async () => {
        await mockLantaiRepo.update(lokasiId, lantaiId, { nomor_lantai: 5 });

        expect(mockDB.lantai.update).toHaveBeenCalledWith({
            where: { id: lantaiId },
            data: { nomor_lantai: 5 },
        });
    });
});

describe('LantaiRepository.delete', () => {
    it('menghapus lantai sesuai id yang dikirim', async () => {
        await mockLantaiRepo.delete(lokasiId, lantaiId);

        expect(mockDB.lantai.delete).toHaveBeenCalledWith({
            where: { id: lantaiId },
        });
    });
});
