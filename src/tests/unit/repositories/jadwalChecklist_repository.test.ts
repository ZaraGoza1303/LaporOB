import { beforeEach, describe, expect, it } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';
import { PrismaClient, JadwalChecklist } from '../../../generated/prisma/client.js';
import { JadwalChecklistRepository } from '../../../repositories/jadwalChecklist_repository.js';

const mockDB = mockDeep<PrismaClient>();
const mockJadwalRepo = new JadwalChecklistRepository(mockDB);

beforeEach(() => {
    mockReset(mockDB);
});

const jadwalId = '3f2a1b7c-9d4e-4a51-8c6f-1d2e3f4a5b6c';

// Fungsi generate fake data dan bisa juga override
function createFakeJadwal(overrides?: Partial<JadwalChecklist>): JadwalChecklist {
    return {
        id: jadwalId,
        nama_tugas: 'Sapu Lantai',
        lantai_id: 'e2fbdc6f-ec0d-4547-a51d-a81b69741ed2',
        kategori_id: '852a6e0e-1bcf-4578-b93b-46f893544bfc',
        ob_id: null,
        hari: ['senin', 'selasa'],
        created_at: new Date('2026-01-01T00:00:00Z'),
        updated_at: new Date('2026-01-01T00:00:00Z'),
        ...overrides,
    };
}

describe('JadwalChecklistRepository.insert', () => {
    it('membuat jadwal baru dan mengembalikan datanya', async () => {
        const fakeJadwal = createFakeJadwal();
        const req = { nama_tugas: 'Sapu Lantai', kategori_id: fakeJadwal.kategori_id, lantai_id: fakeJadwal.lantai_id, ob_id: null, hari: ['senin'] };
        mockDB.jadwalChecklist.create.mockResolvedValue(fakeJadwal);

        const data = await mockJadwalRepo.insert(req);

        expect(mockDB.jadwalChecklist.create).toHaveBeenCalledWith({ data: req });
        expect(data).toEqual(fakeJadwal);
    });
});

describe('JadwalChecklistRepository.getByID', () => {
    it('mengembalikan jadwal sesuai id yang dikirim', async () => {
        const fakeJadwal = createFakeJadwal();
        mockDB.jadwalChecklist.findFirst.mockResolvedValue(fakeJadwal);

        const data = await mockJadwalRepo.getByID(jadwalId);

        expect(mockDB.jadwalChecklist.findFirst).toHaveBeenCalledWith({
            where: { id: jadwalId },
            include: expect.any(Object),
        });
        expect(data).toEqual(fakeJadwal);
    });

    it('mengembalikan null jika jadwal tidak ditemukan', async () => {
        mockDB.jadwalChecklist.findFirst.mockResolvedValue(null);

        const data = await mockJadwalRepo.getByID('jadwal-not-exist');

        expect(data).toBeNull();
    });
});

describe('JadwalChecklistRepository.getAll', () => {
    it('mengembalikan semua jadwal terurut terbaru', async () => {
        const fakeJadwals = [createFakeJadwal()];
        mockDB.jadwalChecklist.findMany.mockResolvedValue(fakeJadwals);

        const data = await mockJadwalRepo.getAll();

        expect(mockDB.jadwalChecklist.findMany).toHaveBeenCalledWith({
            orderBy: { created_at: 'desc' },
            include: expect.any(Object),
        });
        expect(data).toEqual(fakeJadwals);
    });
});

describe('JadwalChecklistRepository.update', () => {
    it('mengupdate jadwal sesuai id dan data yang dikirim', async () => {
        await mockJadwalRepo.update(jadwalId, { nama_tugas: 'Pel Lantai' });

        expect(mockDB.jadwalChecklist.update).toHaveBeenCalledWith({
            where: { id: jadwalId },
            data: { nama_tugas: 'Pel Lantai' },
        });
    });
});

describe('JadwalChecklistRepository.delete', () => {
    it('menghapus jadwal sesuai id yang dikirim', async () => {
        await mockJadwalRepo.delete(jadwalId);

        expect(mockDB.jadwalChecklist.delete).toHaveBeenCalledWith({
            where: { id: jadwalId },
        });
    });
});

describe('JadwalChecklistRepository.getMatchingToday', () => {
    it('mengembalikan jadwal harian kosong yang selalu cocok', async () => {
        const today = new Date('2026-01-05T00:00:00Z');
        mockDB.jadwalChecklist.findMany.mockResolvedValue([
            createFakeJadwal({ hari: [] }),
            createFakeJadwal({ id: 'f6e0481d-67d4-449b-b3dc-376e72bdcf28', hari: ['senin'] }),
        ]);

        const data = await mockJadwalRepo.getMatchingToday(today);

        expect(mockDB.jadwalChecklist.findMany).toHaveBeenCalledWith();
        expect(data.map((j) => j.id)).toContain(jadwalId);
    });

    it('melewati jadwal yang harinya tidak cocok', async () => {
        const senin = new Date('2026-01-05T00:00:00Z');
        mockDB.jadwalChecklist.findMany.mockResolvedValue([
            createFakeJadwal({ hari: ['selasa'] }),
        ]);

        const data = await mockJadwalRepo.getMatchingToday(senin);

        expect(data).toEqual([]);
    });
});
