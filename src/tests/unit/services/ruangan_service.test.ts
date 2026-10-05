import { beforeEach, describe, expect, it } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";
import { PrismaClient, Ruangan } from "../../../generated/prisma/client";
import { RuanganRepository } from "../../../repositories/ruangan_repository";
import { RuanganService } from "../../../services/ruangan_service";
import type { IRedisClient } from "../../../database/redis.interface";

const mockDB = mockDeep<PrismaClient>();
const mockRedis = mockDeep<IRedisClient>();

const mockRuanganRepo = new RuanganRepository(mockDB);
const mockRuanganService = new RuanganService(mockRuanganRepo, mockRedis);

beforeEach(() => {
    mockReset(mockDB);
    mockReset(mockRedis);
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

describe('RuanganService.getAll', () => {
    it('mengembalikan data ruangan dari database dan menyimpannya ke cache jika cache kosong', async () => {
        const fakeRuangans = [createFakeRuangan()];
        mockRedis.get.mockResolvedValue(null);
        mockDB.ruangan.findMany.mockResolvedValue(fakeRuangans);

        const data = await mockRuanganService.getAll();

        expect(mockRedis.get).toHaveBeenCalledWith('ruangan:all:all');
        expect(mockRedis.setEx).toHaveBeenCalledWith('ruangan:all:all', 300, JSON.stringify(fakeRuangans));
        expect(data).toEqual(fakeRuangans);
    });

    it('memakai cache key sesuai lantai_id jika dikirim', async () => {
        const fakeRuangans = [createFakeRuangan()];
        mockRedis.get.mockResolvedValue(null);
        mockDB.ruangan.findMany.mockResolvedValue(fakeRuangans);

        const data = await mockRuanganService.getAll(lantaiId);

        expect(mockRedis.get).toHaveBeenCalledWith(`ruangan:all:${lantaiId}`);
        expect(mockDB.ruangan.findMany).toHaveBeenCalledWith({ where: { lantai_id: lantaiId } });
        expect(data).toEqual(fakeRuangans);
    });

    it('mengembalikan data dari cache dan tidak menyentuh database jika cache hit', async () => {
        const fakeRuangans = [createFakeRuangan()];
        const cachedString = JSON.stringify(fakeRuangans);
        mockRedis.get.mockResolvedValue(cachedString);

        const data = await mockRuanganService.getAll(lantaiId);

        expect(data).toEqual(JSON.parse(cachedString));
        expect(mockDB.ruangan.findMany).not.toHaveBeenCalled();
        expect(mockRedis.setEx).not.toHaveBeenCalled();
    });
});

describe('RuanganService.getById', () => {
    it('mengembalikan detail ruangan sesuai id', async () => {
        const fakeRuangan = createFakeRuangan();
        mockDB.ruangan.findFirst.mockResolvedValue(fakeRuangan);

        const data = await mockRuanganService.getById(lantaiId, ruanganId);

        expect(mockDB.ruangan.findFirst).toHaveBeenCalledWith({
            where: { id: ruanganId, lantai_id: lantaiId },
        });
        expect(data).toEqual(fakeRuangan);
    });

    it('mengembalikan null jika ruangan tidak ditemukan', async () => {
        mockDB.ruangan.findFirst.mockResolvedValue(null);

        const data = await mockRuanganService.getById(lantaiId, 'ruangan-not-exist');

        expect(data).toBeNull();
    });
});

describe('RuanganService.create', () => {
    it('membuat ruangan baru dan menghapus cache lantai dan global', async () => {
        mockDB.ruangan.create.mockResolvedValue(createFakeRuangan());

        await mockRuanganService.create({ lantai_id: lantaiId, nama: 'Ruang Meeting' });

        expect(mockDB.ruangan.create).toHaveBeenCalledWith({
            data: {
                lantai: { connect: { id: lantaiId } },
                nama: 'Ruang Meeting',
            },
        });
        expect(mockRedis.del).toHaveBeenCalledWith(`ruangan:all:${lantaiId}`);
        expect(mockRedis.del).toHaveBeenCalledWith('ruangan:all:all');
    });
});

describe('RuanganService.update', () => {
    it('mengupdate ruangan dan menghapus cache lantai dan global', async () => {
        mockDB.ruangan.update.mockResolvedValue(createFakeRuangan());

        await mockRuanganService.update(lantaiId, ruanganId, { nama: 'Ruang Baru' });

        expect(mockDB.ruangan.update).toHaveBeenCalledWith({
            where: { id: ruanganId },
            data: { nama: 'Ruang Baru' },
        });
        expect(mockRedis.del).toHaveBeenCalledWith(`ruangan:all:${lantaiId}`);
        expect(mockRedis.del).toHaveBeenCalledWith('ruangan:all:all');
    });

    it('hanya menghapus cache global jika lantai_id tidak dikirim', async () => {
        mockDB.ruangan.update.mockResolvedValue(createFakeRuangan());

        await mockRuanganService.update(undefined, ruanganId, { nama: 'Ruang Baru' });

        expect(mockRedis.del).toHaveBeenCalledWith('ruangan:all:all');
    });
});

describe('RuanganService.delete', () => {
    it('menghapus ruangan dan menghapus cache lantai dan global', async () => {
        mockDB.ruangan.delete.mockResolvedValue(createFakeRuangan());

        await mockRuanganService.delete(lantaiId, ruanganId);

        expect(mockDB.ruangan.delete).toHaveBeenCalledWith({
            where: { id: ruanganId },
        });
        expect(mockRedis.del).toHaveBeenCalledWith(`ruangan:all:${lantaiId}`);
        expect(mockRedis.del).toHaveBeenCalledWith('ruangan:all:all');
    });
});
