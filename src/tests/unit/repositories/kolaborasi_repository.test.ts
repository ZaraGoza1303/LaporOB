import { beforeEach, describe, expect, it } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';
import { PrismaClient, KolaborasiLaporan } from '../../../generated/prisma/client.js';
import { KolaborasiRepository } from '../../../repositories/kolaborasi_repository.js';

const mockDB = mockDeep<PrismaClient>();
const mockKolaborasiRepo = new KolaborasiRepository(mockDB);

beforeEach(() => {
    mockReset(mockDB);
});

const laporanId = 'e2fbdc6f-ec0d-4547-a51d-a81b69741ed2';
const obId = '852a6e0e-1bcf-4578-b93b-46f893544bfc';
const kolaborasiId = '3f2a1b7c-9d4e-4a51-8c6f-1d2e3f4a5b6c';

// Fungsi generate fake data dan bisa juga override
function createFakeKolaborasi(overrides?: Partial<KolaborasiLaporan>): KolaborasiLaporan {
    return {
        id: kolaborasiId,
        laporan_id: laporanId,
        ob_id: obId,
        status: 'PENDING',
        created_at: new Date('2026-01-01T00:00:00Z'),
        updated_at: new Date('2026-01-01T00:00:00Z'),
        ...overrides,
    };
}

describe('KolaborasiRepository.findById', () => {
    it('mengembalikan kolaborasi sesuai id', async () => {
        const fake = createFakeKolaborasi();
        mockDB.kolaborasiLaporan.findUnique.mockResolvedValue(fake);

        const data = await mockKolaborasiRepo.findById(kolaborasiId);

        expect(mockDB.kolaborasiLaporan.findUnique).toHaveBeenCalledWith({ where: { id: kolaborasiId } });
        expect(data).toEqual(fake);
    });

    it('mengembalikan null jika tidak ditemukan', async () => {
        mockDB.kolaborasiLaporan.findUnique.mockResolvedValue(null);

        const data = await mockKolaborasiRepo.findById('not-exist');

        expect(data).toBeNull();
    });
});

describe('KolaborasiRepository.findByLaporanAndOb', () => {
    it('mengembalikan kolaborasi sesuai laporan dan ob', async () => {
        const fake = createFakeKolaborasi();
        mockDB.kolaborasiLaporan.findUnique.mockResolvedValue(fake);

        const data = await mockKolaborasiRepo.findByLaporanAndOb(laporanId, obId);

        expect(mockDB.kolaborasiLaporan.findUnique).toHaveBeenCalledWith({
            where: { laporan_id_ob_id: { laporan_id: laporanId, ob_id: obId } },
        });
        expect(data).toEqual(fake);
    });
});

describe('KolaborasiRepository.findPendingByLaporanId', () => {
    it('mengembalikan permintaan pending beserta ob', async () => {
        const fake = [{ ...createFakeKolaborasi(), ob: { id: obId, nama_lengkap: 'Farhan' } }];
        mockDB.kolaborasiLaporan.findMany.mockResolvedValue(fake as never);

        const data = await mockKolaborasiRepo.findPendingByLaporanId(laporanId);

        expect(mockDB.kolaborasiLaporan.findMany).toHaveBeenCalledWith({
            where: { laporan_id: laporanId, status: 'PENDING' },
            include: { ob: { select: { id: true, nama_lengkap: true } } },
        });
        expect(data).toEqual(fake);
    });
});

describe('KolaborasiRepository.create', () => {
    it('membuat permintaan gabung dengan status pending', async () => {
        const fake = createFakeKolaborasi();
        mockDB.kolaborasiLaporan.create.mockResolvedValue(fake);

        const data = await mockKolaborasiRepo.create(laporanId, obId);

        expect(mockDB.kolaborasiLaporan.create).toHaveBeenCalledWith({
            data: { laporan_id: laporanId, ob_id: obId, status: 'PENDING' },
        });
        expect(data).toEqual(fake);
    });
});

describe('KolaborasiRepository.updateStatus', () => {
    it('mengupdate status kolaborasi', async () => {
        const fake = createFakeKolaborasi({ status: 'APPROVED' });
        mockDB.kolaborasiLaporan.update.mockResolvedValue(fake);

        const data = await mockKolaborasiRepo.updateStatus(kolaborasiId, 'APPROVED');

        expect(mockDB.kolaborasiLaporan.update).toHaveBeenCalledWith({
            where: { id: kolaborasiId },
            data: { status: 'APPROVED' },
        });
        expect(data).toEqual(fake);
    });
});

describe('KolaborasiRepository.delete', () => {
    it('menghapus kolaborasi sesuai id', async () => {
        await mockKolaborasiRepo.delete(kolaborasiId);

        expect(mockDB.kolaborasiLaporan.delete).toHaveBeenCalledWith({
            where: { id: kolaborasiId },
        });
    });
});

describe('KolaborasiRepository.findApprovedByLaporanAndOb', () => {
    it('mengembalikan kolaborasi approved sesuai laporan dan ob', async () => {
        const fake = createFakeKolaborasi({ status: 'APPROVED' });
        mockDB.kolaborasiLaporan.findFirst.mockResolvedValue(fake);

        const data = await mockKolaborasiRepo.findApprovedByLaporanAndOb(laporanId, obId);

        expect(mockDB.kolaborasiLaporan.findFirst).toHaveBeenCalledWith({
            where: { laporan_id: laporanId, ob_id: obId, status: 'APPROVED' },
        });
        expect(data).toEqual(fake);
    });
});

describe('KolaborasiRepository.countByLaporanAndStatus', () => {
    it('menghitung kolaborasi berdasarkan laporan dan status', async () => {
        mockDB.kolaborasiLaporan.count.mockResolvedValue(2);

        const data = await mockKolaborasiRepo.countByLaporanAndStatus(laporanId, 'PENDING');

        expect(mockDB.kolaborasiLaporan.count).toHaveBeenCalledWith({
            where: { laporan_id: laporanId, status: 'PENDING' },
        });
        expect(data).toBe(2);
    });
});
