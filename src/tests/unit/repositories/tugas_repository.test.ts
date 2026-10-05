import { beforeEach, describe, expect, it } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';
import { PrismaClient, Tugas } from '../../../generated/prisma/client.js';
import { TugasRepository } from '../../../repositories/tugas_repository.js';
import type { TugasDetailPayload } from '../../../repositories/tugas_repository.interface.js';

const mockDB = mockDeep<PrismaClient>();
const mockTugasRepo = new TugasRepository(mockDB);

beforeEach(() => {
    mockReset(mockDB);
});

const tugasId = '3f2a1b7c-9d4e-4a51-8c6f-1d2e3f4a5b6c';
const kategoriId = 'e2fbdc6f-ec0d-4547-a51d-a81b69741ed2';
const obId = '852a6e0e-1bcf-4578-b93b-46f893544bfc';

// Fungsi generate fake data dan bisa juga override
function createFakeTugas(overrides?: Partial<Tugas>): Tugas {
    return {
        id: tugasId,
        kategori_id: kategoriId,
        nama_tugas: 'Bersihkan Lantai',
        lantai_id: null,
        ob_id: null,
        status: 'BELUM_DIKERJAKAN',
        catatan: null,
        foto_awal: [],
        foto_akhir: [],
        dikerjakan_at: null,
        selesai_at: null,
        is_active: true,
        created_at: new Date('2026-01-01T00:00:00Z'),
        updated_at: new Date('2026-01-01T00:00:00Z'),
        hari: [],
        tanggal_ulang: null,
        tanggal_spesifik: [],
        tanggal_mulai: null,
        tanggal_selesai: new Date('2026-01-10T00:00:00Z'),
        is_approved: false,
        approved_at: null,
        ...overrides,
    };
}

// Fungsi generate fake data dan bisa juga override
function createFakeTugasDetail(overrides?: Partial<TugasDetailPayload>): TugasDetailPayload {
    return {
        ...createFakeTugas(),
        kategori: { id: kategoriId, nama_kategori: 'Kebersihan', created_at: new Date('2026-01-01T00:00:00Z'), updated_at: new Date('2026-01-01T00:00:00Z') },
        lantai: null,
        ob: null,
        ...overrides,
    } as TugasDetailPayload;
}

describe('TugasRepository.getAll', () => {
    it('mengembalikan semua tugas aktif terurut nama asc', async () => {
        const fakeTugas = [createFakeTugasDetail()];
        mockDB.tugas.findMany.mockResolvedValue(fakeTugas);

        const data = await mockTugasRepo.getAll();

        expect(mockDB.tugas.findMany).toHaveBeenCalledWith({
            where: { is_active: true },
            include: {
                kategori: true,
                lantai: { include: { lokasi: true } },
                ob: true,
            },
            orderBy: { nama_tugas: 'asc' },
        });
        expect(data).toEqual(fakeTugas);
    });

    it('memfilter berdasarkan kategori_id jika dikirim', async () => {
        mockDB.tugas.findMany.mockResolvedValue([]);

        await mockTugasRepo.getAll(kategoriId);

        expect(mockDB.tugas.findMany).toHaveBeenCalledWith({
            where: { is_active: true, kategori_id: kategoriId },
            include: expect.any(Object),
            orderBy: { nama_tugas: 'asc' },
        });
    });
});

describe('TugasRepository.getAllPaginated', () => {
    it('mengembalikan tugas paginated dengan search', async () => {
        const fakeItems = [createFakeTugasDetail()];
        mockDB.tugas.findMany.mockResolvedValue(fakeItems);
        mockDB.tugas.count.mockResolvedValue(1);

        const data = await mockTugasRepo.getAllPaginated(1, 10, 'bersih');

        expect(mockDB.tugas.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ skip: 0, take: 10 })
        );
        expect(mockDB.tugas.count).toHaveBeenCalled();
        expect(data.items).toEqual(fakeItems);
        expect(data.meta.total_items).toBe(1);
        expect(data.meta.total_pages).toBe(1);
    });

    it('mengembalikan meta kosong jika tidak ada search', async () => {
        mockDB.tugas.findMany.mockResolvedValue([]);
        mockDB.tugas.count.mockResolvedValue(0);

        const data = await mockTugasRepo.getAllPaginated(2, 5);

        expect(mockDB.tugas.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ skip: 5, take: 5 })
        );
        expect(data.items).toEqual([]);
    });
});

describe('TugasRepository.getByID', () => {
    it('mengembalikan tugas sesuai id yang dikirim', async () => {
        const fakeTugas = createFakeTugas();
        mockDB.tugas.findFirst.mockResolvedValue(fakeTugas);

        const data = await mockTugasRepo.getByID(tugasId);

        expect(mockDB.tugas.findFirst).toHaveBeenCalledWith({ where: { id: tugasId } });
        expect(data).toEqual(fakeTugas);
    });

    it('mengembalikan null jika tugas tidak ditemukan', async () => {
        mockDB.tugas.findFirst.mockResolvedValue(null);

        const data = await mockTugasRepo.getByID('tugas-not-exist');

        expect(data).toBeNull();
    });
});

describe('TugasRepository.getDetailByID', () => {
    it('mengembalikan detail tugas beserta relasi', async () => {
        const fakeDetail = createFakeTugasDetail();
        mockDB.tugas.findFirst.mockResolvedValue(fakeDetail);

        const data = await mockTugasRepo.getDetailByID(tugasId);

        expect(mockDB.tugas.findFirst).toHaveBeenCalledWith({
            where: { id: tugasId },
            include: {
                kategori: true,
                lantai: { include: { lokasi: true } },
                ob: { omit: { password: true } },
            },
        });
        expect(data).toEqual(fakeDetail);
    });
});

describe('TugasRepository.insert', () => {
    it('membuat tugas baru dengan data yang dikirim', async () => {
        const req = { nama_tugas: 'Bersihkan Lantai', kategori: { connect: { id: kategoriId } } } as never;

        await mockTugasRepo.insert(req);

        expect(mockDB.tugas.create).toHaveBeenCalledWith({ data: req });
    });
});

describe('TugasRepository.update', () => {
    it('mengupdate tugas sesuai id dan data yang dikirim', async () => {
        await mockTugasRepo.update(tugasId, { nama_tugas: 'Baru' } as never);

        expect(mockDB.tugas.update).toHaveBeenCalledWith({
            where: { id: tugasId },
            data: { nama_tugas: 'Baru' },
        });
    });
});

describe('TugasRepository.delete', () => {
    it('menghapus tugas sesuai id yang dikirim', async () => {
        await mockTugasRepo.delete(tugasId);

        expect(mockDB.tugas.delete).toHaveBeenCalledWith({ where: { id: tugasId } });
    });
});

describe('TugasRepository.getAllTugasForOb', () => {
    it('mengembalikan tugas tanpa ob atau milik ob tersebut', async () => {
        const fakeTugas = [createFakeTugas()];
        mockDB.tugas.findMany.mockResolvedValue(fakeTugas);

        const data = await mockTugasRepo.getAllTugasForOb(obId);

        expect(mockDB.tugas.findMany).toHaveBeenCalledWith({
            where: { is_active: true, OR: [{ ob_id: null }, { ob_id: obId }] },
            include: expect.any(Object),
            orderBy: { created_at: 'desc' },
        });
        expect(data).toEqual(fakeTugas);
    });
});

describe('TugasRepository.claimByOb', () => {
    it('menandai tugas sedang dikerjakan oleh ob', async () => {
        await mockTugasRepo.claimByOb(tugasId, obId, ['foto1.png']);

        expect(mockDB.tugas.update).toHaveBeenCalledWith({
            where: { id: tugasId },
            data: {
                ob_id: obId,
                status: 'SEDANG_DIKERJAKAN',
                dikerjakan_at: expect.any(Date),
                foto_awal: { set: ['foto1.png'] },
            },
        });
    });
});

describe('TugasRepository.completeByOb', () => {
    it('menandai tugas selesai beserta foto akhir', async () => {
        await mockTugasRepo.completeByOb(tugasId, obId, ['foto2.png'], 'sudah bersih');

        expect(mockDB.tugas.update).toHaveBeenCalledWith({
            where: { id: tugasId, ob_id: obId },
            data: {
                status: 'SELESAI',
                selesai_at: expect.any(Date),
                foto_akhir: { set: ['foto2.png'] },
                catatan: 'sudah bersih',
            },
        });
    });

    it('tidak mengirim catatan jika tidak diisi', async () => {
        await mockTugasRepo.completeByOb(tugasId, obId, ['foto2.png']);

        expect(mockDB.tugas.update).toHaveBeenCalledWith({
            where: { id: tugasId, ob_id: obId },
            data: expect.not.objectContaining({ catatan: expect.anything() }),
        });
    });
});

describe('TugasRepository.getCompletedTugasByObId', () => {
    it('mengembalikan tugas selesai milik ob dengan cursor', async () => {
        const fakeItems = [createFakeTugasDetail(), createFakeTugasDetail({ id: 'f6e0481d-67d4-449b-b3dc-376e72bdcf28' })];
        mockDB.tugas.findMany.mockResolvedValue(fakeItems);
        mockDB.tugas.count.mockResolvedValue(2);

        const data = await mockTugasRepo.getCompletedTugasByObId(obId, 1);

        expect(data.items).toHaveLength(1);
        expect(data.next_cursor).toBe(fakeItems[0]?.id);
        expect(data.meta.total_items).toBe(2);
    });
});

describe('TugasRepository.countCompletedTugasByObId', () => {
    it('menghitung tugas selesai milik ob', async () => {
        mockDB.tugas.count.mockResolvedValue(5);

        const data = await mockTugasRepo.countCompletedTugasByObId(obId);

        expect(mockDB.tugas.count).toHaveBeenCalledWith({
            where: { ob_id: obId, status: 'SELESAI', is_active: true },
        });
        expect(data).toBe(5);
    });
});

describe('TugasRepository.getMatchingToday', () => {
    it('mengembalikan tugas yang jadwalnya cocok hari ini', async () => {
        const today = new Date('2026-01-05T00:00:00Z');
        mockDB.tugas.findMany.mockResolvedValue([createFakeTugas({ hari: [] })]);

        const data = await mockTugasRepo.getMatchingToday(today);

        expect(mockDB.tugas.findMany).toHaveBeenCalledWith({
            where: { is_active: true, tanggal_selesai: { gte: today } },
        });
        expect(data).toHaveLength(1);
    });
});

describe('TugasRepository.getPendingApproval', () => {
    it('mengembalikan tugas selesai yang belum di-approve', async () => {
        mockDB.tugas.findMany.mockResolvedValue([]);

        await mockTugasRepo.getPendingApproval({ start: new Date('2026-01-01'), end: new Date('2026-01-31') });

        expect(mockDB.tugas.findMany).toHaveBeenCalledWith({
            where: {
                status: 'SELESAI',
                is_approved: false,
                created_at: expect.any(Object),
            },
            include: expect.any(Object),
            orderBy: { selesai_at: 'desc' },
        });
    });
});

describe('TugasRepository.approve', () => {
    it('menandai tugas sebagai approved', async () => {
        mockDB.tugas.findUnique.mockResolvedValue({ selesai_at: new Date('2026-01-02T00:00:00Z') } as never);
        mockDB.tugas.update.mockResolvedValue(createFakeTugas());

        await mockTugasRepo.approve(tugasId, 'admin-1');

        expect(mockDB.tugas.update).toHaveBeenCalledWith({
            where: { id: tugasId },
            data: {
                status: 'SELESAI',
                is_approved: true,
                approved_at: expect.any(Date),
                selesai_at: expect.any(Date),
            },
        });
    });
});
