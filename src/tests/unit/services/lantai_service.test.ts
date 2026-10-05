import { beforeEach, describe, expect, it } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";
import { PrismaClient, Lantai } from "../../../generated/prisma/client";
import { LantaiRepository } from "../../../repositories/lantai_repository";
import { LantaiService } from "../../../services/lantai_service";
import type { IRedisClient } from "../../../database/redis.interface";

const mockDB = mockDeep<PrismaClient>();
const mockRedis = mockDeep<IRedisClient>();

const mockLantaiRepo = new LantaiRepository(mockDB);
const mockLantaiService = new LantaiService(mockLantaiRepo, mockRedis);

beforeEach(() => {
    mockReset(mockDB);
    mockReset(mockRedis);
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

describe('LantaiService.getAll', () => {
    it('mengembalikan data lantai dari database dan menyimpannya ke cache jika cache kosong', async () => {
        const fakeLantais = [createFakeLantai()];
        mockRedis.get.mockResolvedValue(null);
        mockDB.lantai.findMany.mockResolvedValue(fakeLantais);

        const data = await mockLantaiService.getAll();

        expect(mockRedis.get).toHaveBeenCalledWith('lantai:all:all');
        expect(mockRedis.setEx).toHaveBeenCalledWith('lantai:all:all', 300, JSON.stringify(fakeLantais));
        expect(data).toEqual(fakeLantais);
    });

    it('memakai cache key sesuai lokasi_id jika dikirim', async () => {
        const fakeLantais = [createFakeLantai()];
        mockRedis.get.mockResolvedValue(null);
        mockDB.lantai.findMany.mockResolvedValue(fakeLantais);

        const data = await mockLantaiService.getAll(lokasiId);

        expect(mockRedis.get).toHaveBeenCalledWith(`lantai:all:${lokasiId}`);
        expect(mockDB.lantai.findMany).toHaveBeenCalledWith({ where: { lokasi_id: lokasiId } });
        expect(data).toEqual(fakeLantais);
    });

    it('mengembalikan data dari cache dan tidak menyentuh database jika cache hit', async () => {
        const fakeLantais = [createFakeLantai()];
        const cachedString = JSON.stringify(fakeLantais);
        mockRedis.get.mockResolvedValue(cachedString);

        const data = await mockLantaiService.getAll(lokasiId);

        expect(data).toEqual(JSON.parse(cachedString));
        expect(mockDB.lantai.findMany).not.toHaveBeenCalled();
        expect(mockRedis.setEx).not.toHaveBeenCalled();
    });
});

describe('LantaiService.getById', () => {
    it('mengembalikan detail lantai sesuai id', async () => {
        const fakeLantai = createFakeLantai();
        mockDB.lantai.findFirst.mockResolvedValue(fakeLantai);

        const data = await mockLantaiService.getById(lokasiId, lantaiId);

        expect(mockDB.lantai.findFirst).toHaveBeenCalledWith({
            where: { id: lantaiId, lokasi_id: lokasiId },
        });
        expect(data).toEqual(fakeLantai);
    });

    it('mengembalikan null jika lantai tidak ditemukan', async () => {
        mockDB.lantai.findFirst.mockResolvedValue(null);

        const data = await mockLantaiService.getById(lokasiId, 'lantai-not-exist');

        expect(data).toBeNull();
    });
});

describe('LantaiService.create', () => {
    it('membuat lantai baru dengan relasi lokasi', async () => {
        mockDB.lantai.create.mockResolvedValue(createFakeLantai());

        await mockLantaiService.create({ lokasi_id: lokasiId, nomor_lantai: 2 });

        expect(mockDB.lantai.create).toHaveBeenCalledWith({
            data: {
                lokasi: { connect: { id: lokasiId } },
                nomor_lantai: 2,
            },
        });
    });
});

describe('LantaiService.update', () => {
    it('mengupdate lantai dan menghapus cache lokasi dan global', async () => {
        mockDB.lantai.update.mockResolvedValue(createFakeLantai());

        await mockLantaiService.update(lokasiId, lantaiId, { nomor_lantai: 5 });

        expect(mockDB.lantai.update).toHaveBeenCalledWith({
            where: { id: lantaiId },
            data: { nomor_lantai: 5 },
        });
        expect(mockRedis.del).toHaveBeenCalledWith(`lantai:all:${lokasiId}`);
        expect(mockRedis.del).toHaveBeenCalledWith('lantai:all:all');
    });

    it('hanya menghapus cache global jika lokasi_id tidak dikirim', async () => {
        mockDB.lantai.update.mockResolvedValue(createFakeLantai());

        await mockLantaiService.update(undefined, lantaiId, { nomor_lantai: 5 });

        expect(mockRedis.del).not.toHaveBeenCalledWith(expect.stringContaining('undefined'));
        expect(mockRedis.del).toHaveBeenCalledWith('lantai:all:all');
    });
});

describe('LantaiService.delete', () => {
    it('menghapus lantai dan menghapus cache lokasi dan global', async () => {
        mockDB.lantai.delete.mockResolvedValue(createFakeLantai());

        await mockLantaiService.delete(lokasiId, lantaiId);

        expect(mockDB.lantai.delete).toHaveBeenCalledWith({
            where: { id: lantaiId },
        });
        expect(mockRedis.del).toHaveBeenCalledWith(`lantai:all:${lokasiId}`);
        expect(mockRedis.del).toHaveBeenCalledWith('lantai:all:all');
    });
});
