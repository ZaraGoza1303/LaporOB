import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';
import { PrismaClient } from '../../../generated/prisma/client.js';
import { LokasiRepository } from '../../../repositories/lokasi_repository.js';
import type { LokasiWithLantai } from '../../../types/lokasi.js';

const mockDB = mockDeep<PrismaClient>();
const mockLokasiRepo = new LokasiRepository(mockDB);

beforeEach(() => {
    mockReset(mockDB);
});

const lokasiId = 'e2fbdc6f-ec0d-4547-a51d-a81b69741ed2';

// Fungsi generate fake data dan bisa juga override
function createFakeLokasi(overrides?: Partial<LokasiWithLantai>): LokasiWithLantai {
    return {
        id: lokasiId,
        nama_lokasi: 'Gedung WGS',
        alamat: 'Jl. Merdeka No. 1',
        created_at: new Date('2026-01-01T00:00:00Z'),
        updated_at: new Date('2026-01-01T00:00:00Z'),
        lantai: [
            {
                id: '3f2a1b7c-9d4e-4a51-8c6f-1d2e3f4a5b6c',
                lokasi_id: lokasiId,
                nomor_lantai: 1,
                created_at: new Date('2026-01-01T00:00:00Z'),
                updated_at: new Date('2026-01-01T00:00:00Z'),
            },
        ],
        ...overrides,
    } as LokasiWithLantai;
}

describe('LokasiRepository.getAll', () => {
    it('mengembalikan semua lokasi beserta lantai terurut asc', async () => {
        const fakeLokasi = [createFakeLokasi()];
        mockDB.lokasi.findMany.mockResolvedValue(fakeLokasi);

        const data = await mockLokasiRepo.getAll();

        expect(mockDB.lokasi.findMany).toHaveBeenCalledWith({
            include: { lantai: { orderBy: { nomor_lantai: 'asc' } } },
            orderBy: { created_at: 'desc' },
        });
        expect(data).toEqual(fakeLokasi);
    });

    it('mengembalikan array kosong jika belum ada lokasi', async () => {
        mockDB.lokasi.findMany.mockResolvedValue([]);

        const data = await mockLokasiRepo.getAll();

        expect(data).toEqual([]);
    });
});

describe('LokasiRepository.getByID', () => {
    it('mengembalikan lokasi sesuai id yang dikirim', async () => {
        const fakeLokasi = createFakeLokasi();
        mockDB.lokasi.findFirst.mockResolvedValue(fakeLokasi);

        const data = await mockLokasiRepo.getByID(lokasiId);

        expect(mockDB.lokasi.findFirst).toHaveBeenCalledWith({
            where: { id: lokasiId },
            include: { lantai: { orderBy: { nomor_lantai: 'asc' } } },
        });
        expect(data).toEqual(fakeLokasi);
    });

    it('mengembalikan null jika lokasi tidak ditemukan', async () => {
        mockDB.lokasi.findFirst.mockResolvedValue(null);

        const data = await mockLokasiRepo.getByID('lokasi-not-exist');

        expect(data).toBeNull();
    });
});

describe('LokasiRepository.insert', () => {
    it('membuat lokasi dan lantai sebanyak jumlah_lantai di dalam transaksi', async () => {
        const mockTxLokasiCreate = vi.fn().mockResolvedValue({ id: lokasiId });
        const mockTxLantaiCreateMany = vi.fn().mockResolvedValue({ count: 2 });

        mockDB.$transaction.mockImplementation(async (callback: any) => {
            return callback({
                lokasi: { create: mockTxLokasiCreate },
                lantai: { createMany: mockTxLantaiCreateMany },
            });
        });

        await mockLokasiRepo.insert({ nama_lokasi: 'Gedung Baru', jumlah_lantai: 2 });

        expect(mockTxLokasiCreate).toHaveBeenCalledWith({
            data: { nama_lokasi: 'Gedung Baru' },
        });
        expect(mockTxLantaiCreateMany).toHaveBeenCalledWith({
            data: [
                { lokasi_id: lokasiId, nomor_lantai: 1 },
                { lokasi_id: lokasiId, nomor_lantai: 2 },
            ],
        });
    });

    it('menyertakan alamat jika diisi', async () => {
        const mockTxLokasiCreate = vi.fn().mockResolvedValue({ id: lokasiId });
        const mockTxLantaiCreateMany = vi.fn().mockResolvedValue({ count: 1 });

        mockDB.$transaction.mockImplementation(async (callback: any) => {
            return callback({
                lokasi: { create: mockTxLokasiCreate },
                lantai: { createMany: mockTxLantaiCreateMany },
            });
        });

        await mockLokasiRepo.insert({ nama_lokasi: 'Gedung Baru', jumlah_lantai: 1, alamat: 'Jl. Merdeka' });

        expect(mockTxLokasiCreate).toHaveBeenCalledWith({
            data: { nama_lokasi: 'Gedung Baru', alamat: 'Jl. Merdeka' },
        });
    });
});

describe('LokasiRepository.update', () => {
    it('mengupdate nama_lokasi jika diisi', async () => {
        const mockTxLokasiUpdate = vi.fn().mockResolvedValue({});
        const mockTxLantaiFindMany = vi.fn().mockResolvedValue([]);

        mockDB.$transaction.mockImplementation(async (callback: any) => {
            return callback({
                lokasi: { update: mockTxLokasiUpdate },
                lantai: { findMany: mockTxLantaiFindMany },
            });
        });

        await mockLokasiRepo.update(lokasiId, { nama_lokasi: 'Gedung Update' });

        expect(mockTxLokasiUpdate).toHaveBeenCalledWith({
            where: { id: lokasiId },
            data: { nama_lokasi: 'Gedung Update' },
        });
    });

    it('menambah lantai baru jika jumlah_lantai lebih besar dari sebelumnya', async () => {
        const mockTxLokasiUpdate = vi.fn();
        const mockTxLantaiFindMany = vi.fn().mockResolvedValue([
            { id: 'lantai-1', lokasi_id: lokasiId, nomor_lantai: 1 },
        ]);
        const mockTxLantaiCreateMany = vi.fn().mockResolvedValue({ count: 1 });

        mockDB.$transaction.mockImplementation(async (callback: any) => {
            return callback({
                lokasi: { update: mockTxLokasiUpdate },
                lantai: { findMany: mockTxLantaiFindMany, createMany: mockTxLantaiCreateMany },
            });
        });

        await mockLokasiRepo.update(lokasiId, { jumlah_lantai: 2 });

        expect(mockTxLokasiUpdate).not.toHaveBeenCalled();
        expect(mockTxLantaiCreateMany).toHaveBeenCalledWith({
            data: [{ lokasi_id: lokasiId, nomor_lantai: 2 }],
        });
    });

    it('menghapus lantai berlebih jika jumlah_lantai lebih kecil dari sebelumnya', async () => {
        const mockTxLokasiUpdate = vi.fn();
        const mockTxLantaiFindMany = vi.fn().mockResolvedValue([
            { id: 'lantai-1', lokasi_id: lokasiId, nomor_lantai: 1 },
            { id: 'lantai-2', lokasi_id: lokasiId, nomor_lantai: 2 },
        ]);
        const mockTxLantaiDeleteMany = vi.fn().mockResolvedValue({ count: 1 });

        mockDB.$transaction.mockImplementation(async (callback: any) => {
            return callback({
                lokasi: { update: mockTxLokasiUpdate },
                lantai: { findMany: mockTxLantaiFindMany, deleteMany: mockTxLantaiDeleteMany },
            });
        });

        await mockLokasiRepo.update(lokasiId, { jumlah_lantai: 1 });

        expect(mockTxLantaiDeleteMany).toHaveBeenCalledWith({
            where: { lokasi_id: lokasiId, nomor_lantai: { gt: 1 } },
        });
    });
});

describe('LokasiRepository.delete', () => {
    it('menghapus lantai lalu lokasi di dalam transaksi', async () => {
        const mockTxLantaiDeleteMany = vi.fn().mockResolvedValue({ count: 1 });
        const mockTxLokasiDelete = vi.fn().mockResolvedValue({});

        mockDB.$transaction.mockImplementation(async (callback: any) => {
            return callback({
                lantai: { deleteMany: mockTxLantaiDeleteMany },
                lokasi: { delete: mockTxLokasiDelete },
            });
        });

        await mockLokasiRepo.delete(lokasiId);

        expect(mockTxLantaiDeleteMany).toHaveBeenCalledWith({
            where: { lokasi_id: lokasiId },
        });
        expect(mockTxLokasiDelete).toHaveBeenCalledWith({
            where: { id: lokasiId },
        });
    });
});
