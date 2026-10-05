import { beforeEach, describe, expect, it } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';
import { PrismaClient, Ruangan } from '../../../generated/prisma/client.js';
import { RuanganRepository } from '../../../repositories/ruangan_repository.js';

const mockDB = mockDeep<PrismaClient>();
const mockRuanganRepo = new RuanganRepository(mockDB);

beforeEach(() => {
    mockReset(mockDB);
});

const lantaiId = 'e2fbdc6f-ec0d-4547-a51d-a81b69741ed2';
const ruanganId = '3f2a1b7c-9d4e-4a51-8c6f-1d2e3f4a5b6c';

// Fungsi generate fake data dan bisa juga override
function createFakeRuangan(overrides?: Partial<Ruangan>): Ruangan {
    return {
        id: ruanganId,
        lantai_id: lantaiId,
        nama: 'Ruang Meeting',
        created_at: new Date('2026-01-01T00:00:00Z'),
        updated_at: new Date('2026-01-01T00:00:00Z'),
        ...overrides,
    };
}

describe('RuanganRepository.getAll', () => {
    it('mengembalikan semua ruangan jika lantai_id tidak dikirim', async () => {
        const fakeRuangans = [createFakeRuangan(), createFakeRuangan({ id: 'f6e0481d-67d4-449b-b3dc-376e72bdcf28', nama: 'Ruang Server' })];
        mockDB.ruangan.findMany.mockResolvedValue(fakeRuangans);

        const data = await mockRuanganRepo.getAll();

        expect(mockDB.ruangan.findMany).toHaveBeenCalledWith({ where: {} });
        expect(data).toEqual(fakeRuangans);
    });

    it('mengembalikan ruangan sesuai lantai_id yang dikirim', async () => {
        const fakeRuangans = [createFakeRuangan()];
        mockDB.ruangan.findMany.mockResolvedValue(fakeRuangans);

        const data = await mockRuanganRepo.getAll(lantaiId);

        expect(mockDB.ruangan.findMany).toHaveBeenCalledWith({ where: { lantai_id: lantaiId } });
        expect(data).toEqual(fakeRuangans);
    });
});

describe('RuanganRepository.getById', () => {
    it('mengembalikan ruangan sesuai id jika lantai_id tidak dikirim', async () => {
        const fakeRuangan = createFakeRuangan();
        mockDB.ruangan.findFirst.mockResolvedValue(fakeRuangan);

        const data = await mockRuanganRepo.getById(undefined, ruanganId);

        expect(mockDB.ruangan.findFirst).toHaveBeenCalledWith({ where: { id: ruanganId } });
        expect(data).toEqual(fakeRuangan);
    });

    it('mengembalikan ruangan sesuai id dan lantai_id yang dikirim', async () => {
        const fakeRuangan = createFakeRuangan();
        mockDB.ruangan.findFirst.mockResolvedValue(fakeRuangan);

        const data = await mockRuanganRepo.getById(lantaiId, ruanganId);

        expect(mockDB.ruangan.findFirst).toHaveBeenCalledWith({
            where: { id: ruanganId, lantai_id: lantaiId },
        });
        expect(data).toEqual(fakeRuangan);
    });

    it('mengembalikan null jika ruangan tidak ditemukan', async () => {
        mockDB.ruangan.findFirst.mockResolvedValue(null);

        const data = await mockRuanganRepo.getById(lantaiId, 'ruangan-not-exist');

        expect(data).toBeNull();
    });
});

describe('RuanganRepository.insert', () => {
    it('membuat ruangan baru dengan data yang dikirim', async () => {
        const req = {
            lantai: { connect: { id: lantaiId } },
            nama: 'Ruang Meeting',
        };

        await mockRuanganRepo.insert(req);

        expect(mockDB.ruangan.create).toHaveBeenCalledWith({ data: req });
    });
});

describe('RuanganRepository.update', () => {
    it('mengupdate ruangan sesuai id dan data yang dikirim', async () => {
        await mockRuanganRepo.update(lantaiId, ruanganId, { nama: 'Ruang Meeting Baru' });

        expect(mockDB.ruangan.update).toHaveBeenCalledWith({
            where: { id: ruanganId },
            data: { nama: 'Ruang Meeting Baru' },
        });
    });
});

describe('RuanganRepository.delete', () => {
    it('menghapus ruangan sesuai id yang dikirim', async () => {
        await mockRuanganRepo.delete(lantaiId, ruanganId);

        expect(mockDB.ruangan.delete).toHaveBeenCalledWith({
            where: { id: ruanganId },
        });
    });
});
