import { beforeEach, describe, expect, it } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";
import { PrismaClient } from "../../../generated/prisma/client";
import { LokasiRepository } from "../../../repositories/lokasi_repository";
import { LokasiService } from "../../../services/lokasi_service";
import type { IRedisClient } from "../../../database/redis.interface";
import type { LokasiWithLantai, LokasiRes } from "../../../types/lokasi";

const mockDB = mockDeep<PrismaClient>();
const mockRedis = mockDeep<IRedisClient>();

const mockLokasiRepo = new LokasiRepository(mockDB);
const mockLokasiService = new LokasiService(mockLokasiRepo, mockRedis);

beforeEach(() => {
    mockReset(mockDB);
    mockReset(mockRedis);
});

const lokasiId = 'e2fbdc6f-ec0d-4547-a51d-a81b69741ed2';

// Fungsi generate fake data dan bisa juga override
function createFakeLokasiWithLantai(overrides?: Partial<LokasiWithLantai>): LokasiWithLantai {
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
            {
                id: 'f6e0481d-67d4-449b-b3dc-376e72bdcf28',
                lokasi_id: lokasiId,
                nomor_lantai: 2,
                created_at: new Date('2026-01-01T00:00:00Z'),
                updated_at: new Date('2026-01-01T00:00:00Z'),
            },
        ],
        ...overrides,
    } as LokasiWithLantai;
}

function createFakeLokasiRes(overrides?: Partial<LokasiRes>): LokasiRes {
    return {
        id: lokasiId,
        nama_lokasi: 'Gedung WGS',
        alamat: 'Jl. Merdeka No. 1',
        jumlah_lantai: 2,
        lantai: [
            { id: '3f2a1b7c-9d4e-4a51-8c6f-1d2e3f4a5b6c', nomor_lantai: 1 },
            { id: 'f6e0481d-67d4-449b-b3dc-376e72bdcf28', nomor_lantai: 2 },
        ],
        created_at: new Date('2026-01-01T00:00:00Z'),
        updated_at: new Date('2026-01-01T00:00:00Z'),
        ...overrides,
    };
}

describe('LokasiService.getAll', () => {
    it('mengembalikan data lokasi dari database dan menyimpannya ke cache jika cache kosong', async () => {
        const fakeRows = [createFakeLokasiWithLantai()];
        const expected = [createFakeLokasiRes()];

        mockRedis.get.mockResolvedValue(null);
        mockDB.lokasi.findMany.mockResolvedValue(fakeRows);

        const data = await mockLokasiService.getAll();

        expect(mockRedis.get).toHaveBeenCalledWith('lokasi:all');
        expect(mockRedis.setEx).toHaveBeenCalledWith('lokasi:all', 300, JSON.stringify(expected));
        expect(data).toEqual(expected);
    });

    it('mengembalikan data lokasi dari cache dan tidak menyentuh database jika cache hit', async () => {
        const cached = [createFakeLokasiRes()];
        const cachedString = JSON.stringify(cached);
        mockRedis.get.mockResolvedValue(cachedString);

        const data = await mockLokasiService.getAll();

        expect(data).toEqual(JSON.parse(cachedString));
        expect(mockDB.lokasi.findMany).not.toHaveBeenCalled();
        expect(mockRedis.setEx).not.toHaveBeenCalled();
    });

    it('menghitung jumlah_lantai 0 jika lokasi belum punya lantai', async () => {
        const fakeRows = [createFakeLokasiWithLantai({ lantai: [] })];

        mockRedis.get.mockResolvedValue(null);
        mockDB.lokasi.findMany.mockResolvedValue(fakeRows);

        const data = await mockLokasiService.getAll();

        expect(data[0]?.jumlah_lantai).toBe(0);
        expect(data[0]?.lantai).toEqual([]);
    });
});

describe('LokasiService.getByID', () => {
    it('mengembalikan detail lokasi yang sudah di-mapping', async () => {
        const fakeRow = createFakeLokasiWithLantai();
        const expected = createFakeLokasiRes();
        mockDB.lokasi.findFirst.mockResolvedValue(fakeRow);

        const data = await mockLokasiService.getByID(lokasiId);

        expect(data).toEqual(expected);
    });

    it('mengembalikan null jika lokasi tidak ditemukan', async () => {
        mockDB.lokasi.findFirst.mockResolvedValue(null);

        const data = await mockLokasiService.getByID('lokasi-not-exist');

        expect(data).toBeNull();
    });
});

describe('LokasiService.create', () => {
    it('membuat lokasi baru tanpa menghapus cache', async () => {
        mockDB.$transaction.mockImplementation(async () => undefined as never);

        await mockLokasiService.create({ nama_lokasi: 'Gedung Baru', jumlah_lantai: 2 });

        expect(mockDB.$transaction).toHaveBeenCalledTimes(1);
        expect(mockRedis.del).not.toHaveBeenCalled();
    });
});

describe('LokasiService.update', () => {
    it('hanya mengirim field yang diisi dan menghapus cache', async () => {
        mockDB.$transaction.mockImplementation(async () => undefined as never);

        await mockLokasiService.update(lokasiId, { nama_lokasi: 'Gedung Update' });

        expect(mockDB.$transaction).toHaveBeenCalledTimes(1);
        expect(mockRedis.del).toHaveBeenCalledWith('lokasi:all');
    });

    it('mengirim jumlah_lantai jika diisi', async () => {
        mockDB.$transaction.mockImplementation(async () => undefined as never);

        await mockLokasiService.update(lokasiId, { jumlah_lantai: 5 });

        expect(mockDB.$transaction).toHaveBeenCalledTimes(1);
        expect(mockRedis.del).toHaveBeenCalledWith('lokasi:all');
    });
});

describe('LokasiService.delete', () => {
    it('menghapus lokasi dan menghapus cache', async () => {
        mockDB.$transaction.mockImplementation(async () => undefined as never);

        await mockLokasiService.delete(lokasiId);

        expect(mockDB.$transaction).toHaveBeenCalledTimes(1);
        expect(mockRedis.del).toHaveBeenCalledWith('lokasi:all');
    });
});
