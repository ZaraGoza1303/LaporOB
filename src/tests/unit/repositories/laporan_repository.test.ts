import { beforeEach, describe, expect, it } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';
import { PrismaClient, Laporan_karyawan } from '../../../generated/prisma/client.js';
import { LaporanRepository } from '../../../repositories/laporan_repository.js';

const mockDB = mockDeep<PrismaClient>();
const mockLaporanRepo = new LaporanRepository(mockDB);

beforeEach(() => {
    mockReset(mockDB);
});

const laporanId = '3f2a1b7c-9d4e-4a51-8c6f-1d2e3f4a5b6c';
const userId = 'e2fbdc6f-ec0d-4547-a51d-a81b69741ed2';
const obId = '852a6e0e-1bcf-4578-b93b-46f893544bfc';

// Fungsi generate fake data dan bisa juga override
function createFakeLaporan(overrides?: Partial<Laporan_karyawan>): Laporan_karyawan {
    return {
        id: laporanId,
        pelapor_id: userId,
        ob_id: null,
        lantai_id: 'lantai-1',
        ruangan_id: 'ruangan-1',
        kategori_id: 'kategori-1',
        deskripsi_kendala: 'AC bocor',
        status: 'BELUM_DIKERJAKAN',
        prioritas: 'STANDARD',
        foto_masalah: [],
        alasan_gagal: null,
        admin_catatan: null,
        is_approved: false,
        is_kolaborasi_open: false,
        catatan_kolaborasi: null,
        dikerjakan_at: null,
        selesai_at: null,
        dibatalkan_at: null,
        created_at: new Date('2026-01-01T00:00:00Z'),
        updated_at: new Date('2026-01-01T00:00:00Z'),
        ...overrides,
    };
}

describe('LaporanRepository.getActivity', () => {
    it('mengembalikan 2 aktivitas terakhir milik user', async () => {
        const fakeItems = [createFakeLaporan(), createFakeLaporan({ id: 'lain' })];
        mockDB.laporan_karyawan.findMany.mockResolvedValue(fakeItems as never);

        const data = await mockLaporanRepo.getActivity(userId);

        expect(mockDB.laporan_karyawan.findMany).toHaveBeenCalledWith({
            where: { pelapor_id: userId },
            include: expect.any(Object),
            orderBy: { created_at: 'desc' },
            take: 2,
        });
        expect(data).toEqual(fakeItems);
    });
});

describe('LaporanRepository.insertReport', () => {
    it('membuat laporan dan mengembalikan id-nya', async () => {
        mockDB.laporan_karyawan.create.mockResolvedValue({ id: laporanId } as never);
        const req = { deskripsi_kendala: 'AC bocor' } as never;

        const data = await mockLaporanRepo.insertReport(req);

        expect(mockDB.laporan_karyawan.create).toHaveBeenCalledWith({
            data: req,
            select: { id: true },
        });
        expect(data).toBe(laporanId);
    });
});

describe('LaporanRepository.patchLaporan', () => {
    it('mengupdate laporan sesuai data yang dikirim', async () => {
        await mockLaporanRepo.patchLaporan(laporanId, { status: 'SELESAI' } as never);

        expect(mockDB.laporan_karyawan.update).toHaveBeenCalledWith({
            where: { id: laporanId },
            data: { status: 'SELESAI' },
        });
    });
});

describe('LaporanRepository.updateKolaborasiOpen', () => {
    it('membuka kolaborasi beserta catatan', async () => {
        await mockLaporanRepo.updateKolaborasiOpen(laporanId, true, 'butuh bantuan');

        expect(mockDB.laporan_karyawan.update).toHaveBeenCalledWith({
            where: { id: laporanId },
            data: { is_kolaborasi_open: true, catatan_kolaborasi: 'butuh bantuan' },
        });
    });

    it('menutup kolaborasi dan menghapus catatan', async () => {
        await mockLaporanRepo.updateKolaborasiOpen(laporanId, false);

        expect(mockDB.laporan_karyawan.update).toHaveBeenCalledWith({
            where: { id: laporanId },
            data: { is_kolaborasi_open: false, catatan_kolaborasi: null },
        });
    });
});

describe('LaporanRepository.getReportDetailById', () => {
    it('mengembalikan detail laporan beserta relasi', async () => {
        const fakeDetail = { ...createFakeLaporan(), kategori: { nama_kategori: 'AC' } };
        mockDB.laporan_karyawan.findUnique.mockResolvedValue(fakeDetail as never);

        const data = await mockLaporanRepo.getReportDetailById(laporanId);

        expect(mockDB.laporan_karyawan.findUnique).toHaveBeenCalledWith({
            where: { id: laporanId },
            include: expect.any(Object),
        });
        expect(data).toEqual(fakeDetail);
    });

    it('mengembalikan null jika laporan tidak ditemukan', async () => {
        mockDB.laporan_karyawan.findUnique.mockResolvedValue(null);

        const data = await mockLaporanRepo.getReportDetailById('not-exist');

        expect(data).toBeNull();
    });
});

describe('LaporanRepository.getLaporanCountByUserId', () => {
    it('menghitung laporan milik user', async () => {
        mockDB.laporan_karyawan.count.mockResolvedValue(4);

        const data = await mockLaporanRepo.getLaporanCountByUserId(userId);

        expect(mockDB.laporan_karyawan.count).toHaveBeenCalledWith({
            where: { pelapor_id: userId },
        });
        expect(data).toBe(4);
    });
});

describe('LaporanRepository.deleteLaporan', () => {
    it('menghapus laporan sesuai id', async () => {
        await mockLaporanRepo.deleteLaporan(laporanId);

        expect(mockDB.laporan_karyawan.delete).toHaveBeenCalledWith({
            where: { id: laporanId },
        });
    });
});

describe('LaporanRepository.ambilLaporan', () => {
    it('menandai laporan sedang dikerjakan oleh ob', async () => {
        await mockLaporanRepo.ambilLaporan(laporanId, obId);

        expect(mockDB.laporan_karyawan.update).toHaveBeenCalledWith({
            where: { id: laporanId },
            data: { status: 'SEDANG_DIKERJAKAN', ob_id: obId, dikerjakan_at: expect.any(Date) },
        });
    });
});

describe('LaporanRepository.approveLaporan', () => {
    it('menandai laporan selesai dan approved', async () => {
        const fakeLaporan = createFakeLaporan({ status: 'SELESAI', is_approved: true });
        mockDB.laporan_karyawan.update.mockResolvedValue(fakeLaporan);

        const data = await mockLaporanRepo.approveLaporan(laporanId, 'bagus');

        expect(mockDB.laporan_karyawan.update).toHaveBeenCalled();
        expect(data).toEqual(fakeLaporan);
    });
});
