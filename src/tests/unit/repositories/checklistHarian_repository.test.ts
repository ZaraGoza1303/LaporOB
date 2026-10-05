import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';
import { PrismaClient } from '../../../generated/prisma/client.js';
import { ChecklistHarianRepository } from '../../../repositories/checklistHarian_repository.js';
import type { ChecklistHarianWithRelations } from '../../../repositories/checklistHarian_repository.interface.js';

const mockDB = mockDeep<PrismaClient>();
const mockChecklistRepo = new ChecklistHarianRepository(mockDB);

beforeEach(() => {
    mockReset(mockDB);
});

const checklistId = '3f2a1b7c-9d4e-4a51-8c6f-1d2e3f4a5b6c';
const obId = 'e2fbdc6f-ec0d-4547-a51d-a81b69741ed2';

// Fungsi generate fake data dan bisa juga override
function createFakeChecklist(overrides?: Partial<ChecklistHarianWithRelations>): ChecklistHarianWithRelations {
    return {
        id: checklistId,
        tanggal: new Date('2026-01-05T00:00:00Z'),
        nama_tugas: 'Sapu Lantai',
        ob_id: obId,
        lantai_id: '852a6e0e-1bcf-4578-b93b-46f893544bfc',
        kategori_id: 'f6e0481d-67d4-449b-b3dc-376e72bdcf28',
        status: 'BELUM_DIKERJAKAN',
        catatan: null,
        dikerjakan_at: null,
        selesai_at: null,
        terlewat_at: null,
        is_approved: false,
        approved_at: null,
        created_at: new Date('2026-01-01T00:00:00Z'),
        updated_at: new Date('2026-01-01T00:00:00Z'),
        kategori: { id: 'f6e0481d-67d4-449b-b3dc-376e72bdcf28', nama_kategori: 'Kebersihan', created_at: new Date(), updated_at: new Date() },
        lantai: { id: '852a6e0e-1bcf-4578-b93b-46f893544bfc', lokasi_id: 'lokasi-1', nomor_lantai: 1, created_at: new Date(), updated_at: new Date(), lokasi: { id: 'lokasi-1', nama_lokasi: 'Gedung WGS', alamat: null, created_at: new Date(), updated_at: new Date() } },
        ob: null,
        ...overrides,
    } as ChecklistHarianWithRelations;
}

describe('ChecklistHarianRepository.getAll', () => {
    it('mengembalikan semua checklist terurut terbaru', async () => {
        const fakeItems = [createFakeChecklist()];
        mockDB.checklist_harian.findMany.mockResolvedValue(fakeItems);

        const data = await mockChecklistRepo.getAll();

        expect(mockDB.checklist_harian.findMany).toHaveBeenCalledWith({
            orderBy: { created_at: 'desc' },
            include: expect.any(Object),
        });
        expect(data).toEqual(fakeItems);
    });
});

describe('ChecklistHarianRepository.getAllPaginated', () => {
    it('mengembalikan checklist paginated dengan search', async () => {
        const fakeItems = [createFakeChecklist()];
        mockDB.checklist_harian.findMany.mockResolvedValue(fakeItems);
        mockDB.checklist_harian.count.mockResolvedValue(1);

        const data = await mockChecklistRepo.getAllPaginated(1, 10, 'sapu');

        expect(mockDB.checklist_harian.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ skip: 0, take: 10 })
        );
        expect(data.items).toEqual(fakeItems);
        expect(data.meta.total_items).toBe(1);
    });
});

describe('ChecklistHarianRepository.getByID', () => {
    it('mengembalikan checklist sesuai id yang dikirim', async () => {
        const fakeItem = createFakeChecklist();
        mockDB.checklist_harian.findFirst.mockResolvedValue(fakeItem);

        const data = await mockChecklistRepo.getByID(checklistId);

        expect(mockDB.checklist_harian.findFirst).toHaveBeenCalledWith({
            where: { id: checklistId },
            include: expect.any(Object),
        });
        expect(data).toEqual(fakeItem);
    });

    it('mengembalikan null jika checklist tidak ditemukan', async () => {
        mockDB.checklist_harian.findFirst.mockResolvedValue(null);

        const data = await mockChecklistRepo.getByID('checklist-not-exist');

        expect(data).toBeNull();
    });
});

describe('ChecklistHarianRepository.insert', () => {
    it('membuat checklist baru dengan data yang dikirim', async () => {
        const req = { nama_tugas: 'Sapu', lantai_id: 'lantai-1', kategori_id: 'kat-1', tanggal: new Date(), status: 'BELUM_DIKERJAKAN' } as never;

        await mockChecklistRepo.insert(req);

        expect(mockDB.checklist_harian.create).toHaveBeenCalledWith({ data: req });
    });
});

describe('ChecklistHarianRepository.insertMany', () => {
    it('tidak memanggil createMany jika data kosong', async () => {
        await mockChecklistRepo.insertMany([]);

        expect(mockDB.checklist_harian.createMany).not.toHaveBeenCalled();
    });

    it('membuat banyak checklist sekaligus', async () => {
        const req = [{ nama_tugas: 'Sapu' }] as never;

        await mockChecklistRepo.insertMany(req);

        expect(mockDB.checklist_harian.createMany).toHaveBeenCalledWith({ data: req });
    });
});

describe('ChecklistHarianRepository.update', () => {
    it('mengupdate checklist sesuai id dan data yang dikirim', async () => {
        await mockChecklistRepo.update(checklistId, { nama_tugas: 'Pel' } as never);

        expect(mockDB.checklist_harian.update).toHaveBeenCalledWith({
            where: { id: checklistId },
            data: { nama_tugas: 'Pel' },
        });
    });
});

describe('ChecklistHarianRepository.delete', () => {
    it('menghapus checklist sesuai id yang dikirim', async () => {
        await mockChecklistRepo.delete(checklistId);

        expect(mockDB.checklist_harian.delete).toHaveBeenCalledWith({
            where: { id: checklistId },
        });
    });
});

describe('ChecklistHarianRepository.getTodayChecklists', () => {
    it('mengembalikan checklist milik ob tanpa backup jika sudah 2', async () => {
        const tanggal = new Date('2026-01-05T12:00:00Z');
        mockDB.penugasanOb.findMany.mockResolvedValue([{ lokasi_id: 'lokasi-1' }]);
        const own = [createFakeChecklist(), createFakeChecklist({ id: 'f6e0481d-67d4-449b-b3dc-376e72bdcf28' })];
        mockDB.checklist_harian.findMany.mockResolvedValueOnce(own as never);

        const data = await mockChecklistRepo.getTodayChecklists(obId, tanggal);

        expect(data).toEqual(own);
        expect(mockDB.checklist_harian.findMany).toHaveBeenCalledTimes(1);
    });

    it('menggabungkan backup jika checklist milik ob kurang dari 2', async () => {
        const tanggal = new Date('2026-01-05T12:00:00Z');
        mockDB.penugasanOb.findMany.mockResolvedValue([{ lokasi_id: 'lokasi-1' }]);
        const own = [createFakeChecklist()];
        const backup = [createFakeChecklist({ id: 'backup-1', ob_id: null })];
        mockDB.checklist_harian.findMany
            .mockResolvedValueOnce(own as never)
            .mockResolvedValueOnce(backup as never);

        const data = await mockChecklistRepo.getTodayChecklists(obId, tanggal);

        expect(data).toHaveLength(2);
        expect(mockDB.checklist_harian.findMany).toHaveBeenCalledTimes(2);
    });
});

describe('ChecklistHarianRepository.ambilChecklist', () => {
    it('menandai checklist diambil oleh ob', async () => {
        await mockChecklistRepo.ambilChecklist(checklistId, obId);

        expect(mockDB.checklist_harian.update).toHaveBeenCalledWith({
            where: { id: checklistId },
            data: { ob_id: obId },
        });
    });
});

describe('ChecklistHarianRepository.approve', () => {
    it('menandai checklist sebagai approved', async () => {
        mockDB.checklist_harian.findUnique.mockResolvedValue({ selesai_at: new Date() } as never);
        mockDB.checklist_harian.update.mockResolvedValue(createFakeChecklist() as never);

        await mockChecklistRepo.approve(checklistId, 'admin-1');

        expect(mockDB.checklist_harian.update).toHaveBeenCalledWith({
            where: { id: checklistId },
            data: expect.objectContaining({ is_approved: true }),
        });
    });
});

describe('ChecklistHarianRepository.getExistingInstanceKeys', () => {
    it('mengembalikan kunci instance hari ini', async () => {
        const today = new Date('2026-01-05T00:00:00Z');
        const fakeKeys = [{ nama_tugas: 'Sapu', lantai_id: 'lantai-1', ob_id: obId }];
        mockDB.checklist_harian.findMany.mockResolvedValue(fakeKeys as never);

        const data = await mockChecklistRepo.getExistingInstanceKeys(today);

        expect(mockDB.checklist_harian.findMany).toHaveBeenCalledWith({
            where: { tanggal: { gte: expect.any(Date), lte: expect.any(Date) } },
            select: { nama_tugas: true, lantai_id: true, ob_id: true },
        });
        expect(data).toEqual(fakeKeys);
    });
});
