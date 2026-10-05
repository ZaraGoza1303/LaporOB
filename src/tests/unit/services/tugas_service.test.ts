import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";
import { PrismaClient, Tugas } from "../../../generated/prisma/client";
import { TugasRepository } from "../../../repositories/tugas_repository";
import { TugasService } from "../../../services/tugas_service";
import type { IRedisClient } from "../../../database/redis.interface";
import type { ISkillService } from "../../../services/skill_service.interface";
import type { IAchievementService } from "../../../services/achievement_service.interface";
import type { TugasDetailPayload } from "../../../repositories/tugas_repository.interface";
import * as urlUtils from "../../../utils/url";
import { AppError } from "../../../utils/error";

const mockDB = mockDeep<PrismaClient>();
const mockRedis = mockDeep<IRedisClient>();
const mockSkillService = mockDeep<ISkillService>();
const mockAchievementService = mockDeep<IAchievementService>();

const mockTugasRepo = new TugasRepository(mockDB);
const mockTugasService = new TugasService(mockTugasRepo, mockRedis, mockSkillService, mockAchievementService);

beforeEach(() => {
    mockReset(mockDB);
    mockReset(mockRedis);
    mockReset(mockSkillService);
    mockReset(mockAchievementService);
    vi.restoreAllMocks();
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

describe('TugasService.getAll', () => {
    it('mengembalikan data tugas dari database dan menyimpannya ke cache jika cache kosong', async () => {
        const fakeRows = [createFakeTugasDetail()];
        mockRedis.get.mockResolvedValue(null);
        mockDB.tugas.findMany.mockResolvedValue(fakeRows);

        const data = await mockTugasService.getAll();

        expect(mockRedis.get).toHaveBeenCalledWith('tugas:all:all');
        expect(mockRedis.setEx).toHaveBeenCalledWith('tugas:all:all', 300, expect.any(String));
        expect(data).toHaveLength(1);
        expect(data[0]?.total_durasi).toBeNull();
    });

    it('menghitung total_durasi jika sudah dikerjakan dan selesai', async () => {
        const fakeRows = [
            createFakeTugasDetail({
                dikerjakan_at: new Date('2026-01-01T08:00:00Z'),
                selesai_at: new Date('2026-01-01T09:00:00Z'),
            }),
        ];
        mockRedis.get.mockResolvedValue(null);
        mockDB.tugas.findMany.mockResolvedValue(fakeRows);

        const data = await mockTugasService.getAll();

        expect(data[0]?.total_durasi).toBe(3600);
    });

    it('mengembalikan data dari cache dan tidak menyentuh database jika cache hit', async () => {
        const cached = [{ id: tugasId }];
        const cachedString = JSON.stringify(cached);
        mockRedis.get.mockResolvedValue(cachedString);

        const data = await mockTugasService.getAll();

        expect(data).toEqual(JSON.parse(cachedString));
        expect(mockDB.tugas.findMany).not.toHaveBeenCalled();
    });
});

describe('TugasService.getByID', () => {
    it('mengembalikan tugas sesuai id', async () => {
        const fakeTugas = createFakeTugas();
        mockDB.tugas.findFirst.mockResolvedValue(fakeTugas);

        const data = await mockTugasService.getByID(tugasId);

        expect(data).toEqual(fakeTugas);
    });

    it('mengembalikan null jika tugas tidak ditemukan', async () => {
        mockDB.tugas.findFirst.mockResolvedValue(null);

        const data = await mockTugasService.getByID('tugas-not-exist');

        expect(data).toBeNull();
    });
});

describe('TugasService.getDetailByID', () => {
    it('mengembalikan detail tugas yang sudah di-mapping', async () => {
        mockDB.tugas.findFirst.mockResolvedValue(createFakeTugasDetail());

        const data = await mockTugasService.getDetailByID(tugasId);

        expect(data?.id).toBe(tugasId);
        expect(data?.foto_awal).toEqual([]);
    });

    it('mengembalikan null jika tugas tidak ditemukan', async () => {
        mockDB.tugas.findFirst.mockResolvedValue(null);

        const data = await mockTugasService.getDetailByID('tugas-not-exist');

        expect(data).toBeNull();
    });
});

describe('TugasService.create', () => {
    it('membuat tugas baru dan menghapus cache', async () => {
        mockDB.tugas.create.mockResolvedValue(createFakeTugas());

        await mockTugasService.create({
            kategori_id: kategoriId,
            nama_tugas: 'Bersihkan Lantai',
            tanggal_selesai: '2026-01-10',
        });

        expect(mockDB.tugas.create).toHaveBeenCalledWith({
            data: expect.objectContaining({ nama_tugas: 'Bersihkan Lantai' }),
        });
        expect(mockRedis.del).toHaveBeenCalledWith(`tugas:all:${kategoriId}`);
        expect(mockRedis.del).toHaveBeenCalledWith('tugas:all:all');
    });
});

describe('TugasService.update', () => {
    it('mengupdate tugas dan menghapus cache kategori lama dan baru', async () => {
        mockDB.tugas.findFirst.mockResolvedValue(createFakeTugas({ kategori_id: 'kategori-lama' }));
        mockDB.tugas.update.mockResolvedValue(createFakeTugas());

        await mockTugasService.update(tugasId, { nama_tugas: 'Baru', kategori_id: kategoriId });

        expect(mockDB.tugas.update).toHaveBeenCalledWith({
            where: { id: tugasId },
            data: expect.objectContaining({ nama_tugas: 'Baru' }),
        });
        expect(mockRedis.del).toHaveBeenCalledWith(`tugas:all:${kategoriId}`);
        expect(mockRedis.del).toHaveBeenCalledWith('tugas:all:kategori-lama');
        expect(mockRedis.del).toHaveBeenCalledWith('tugas:all:all');
    });

    it('melempar AppError 404 jika tugas tidak ditemukan', async () => {
        mockDB.tugas.findFirst.mockResolvedValue(null);

        await expect(mockTugasService.update(tugasId, { nama_tugas: 'Baru' })).rejects.toThrow(
            new AppError('Tugas tidak ditemukan', 404)
        );
    });

    it('mengisi dikerjakan_at saat status menjadi SEDANG_DIKERJAKAN', async () => {
        mockDB.tugas.findFirst.mockResolvedValue(createFakeTugas());
        mockDB.tugas.update.mockResolvedValue(createFakeTugas());

        await mockTugasService.update(tugasId, { status: 'SEDANG_DIKERJAKAN' });

        expect(mockDB.tugas.update).toHaveBeenCalledWith({
            where: { id: tugasId },
            data: expect.objectContaining({ status: 'SEDANG_DIKERJAKAN', dikerjakan_at: expect.any(Date) }),
        });
    });
});

describe('TugasService.delete', () => {
    it('menghapus tugas dan menghapus cache global', async () => {
        mockDB.tugas.delete.mockResolvedValue(createFakeTugas());

        await mockTugasService.delete(tugasId);

        expect(mockDB.tugas.delete).toHaveBeenCalledWith({ where: { id: tugasId } });
        expect(mockRedis.del).toHaveBeenCalledWith('tugas:all:all');
    });
});

describe('TugasService.claimTugas', () => {
    it('ob berhasil mengambil tugas yang belum diambil', async () => {
        mockDB.tugas.findFirst.mockResolvedValue(createFakeTugas({ ob_id: null }));
        mockDB.tugas.update.mockResolvedValue(createFakeTugas());

        await mockTugasService.claimTugas(tugasId, obId, ['foto1.png']);

        expect(mockDB.tugas.update).toHaveBeenCalledWith({
            where: { id: tugasId },
            data: expect.objectContaining({ ob_id: obId }),
        });
    });

    it('melempar AppError 404 jika tugas tidak ditemukan', async () => {
        mockDB.tugas.findFirst.mockResolvedValue(null);

        await expect(mockTugasService.claimTugas(tugasId, obId, [])).rejects.toThrow(AppError);
    });

    it('melempar AppError 409 jika tugas sudah diambil ob lain', async () => {
        mockDB.tugas.findFirst.mockResolvedValue(createFakeTugas({ ob_id: 'ob-lain' }));

        await expect(mockTugasService.claimTugas(tugasId, obId, [])).rejects.toThrow(
            new AppError('Tugas sudah diambil oleh OB lain', 409)
        );
    });
});

describe('TugasService.completeTugas', () => {
    it('ob menyelesaikan tugas miliknya dan memicu skill serta achievement', async () => {
        mockDB.tugas.findFirst.mockResolvedValue(createFakeTugas({ ob_id: obId }));
        mockDB.tugas.update.mockResolvedValue(createFakeTugas());

        await mockTugasService.completeTugas(tugasId, obId, ['foto2.png'], 'sudah bersih');

        expect(mockDB.tugas.update).toHaveBeenCalled();
        expect(mockSkillService.prosesSkillOtomatisForOb).toHaveBeenCalledWith(obId);
        expect(mockAchievementService.prosesOtomatisUntukOb).toHaveBeenCalledWith(obId);
    });

    it('melempar error jika bukan tugas milik ob', async () => {
        mockDB.tugas.findFirst.mockResolvedValue(createFakeTugas({ ob_id: 'ob-lain' }));

        await expect(mockTugasService.completeTugas(tugasId, obId, [])).rejects.toThrow();
    });
});

describe('TugasService.getScheduledTugas', () => {
    it('hanya mengembalikan tugas tanpa ob atau milik ob tersebut', async () => {
        const today = new Date('2026-01-05T00:00:00Z');
        mockDB.tugas.findMany.mockResolvedValue([
            createFakeTugas({ ob_id: null }),
            createFakeTugas({ id: 'tugas-2', ob_id: obId }),
            createFakeTugas({ id: 'tugas-3', ob_id: 'ob-lain' }),
        ]);

        const data = await mockTugasService.getScheduledTugas(obId, today);

        expect(data.map((t) => t.id)).toEqual(expect.arrayContaining([tugasId, 'tugas-2']));
        expect(data.map((t) => t.id)).not.toContain('tugas-3');
    });
});

describe('TugasService.approveTugas', () => {
    it('admin menyetujui tugas dan menghapus cache', async () => {
        mockDB.tugas.findFirst.mockResolvedValue(createFakeTugas());
        mockDB.tugas.findUnique.mockResolvedValue({ selesai_at: new Date() } as never);
        mockDB.tugas.update.mockResolvedValue(createFakeTugas());

        await mockTugasService.approveTugas(tugasId, 'admin-1');

        expect(mockDB.tugas.update).toHaveBeenCalled();
        expect(mockRedis.del).toHaveBeenCalledWith('tugas:all:all');
    });

    it('melempar AppError 404 jika tugas tidak ditemukan', async () => {
        mockDB.tugas.findFirst.mockResolvedValue(null);

        await expect(mockTugasService.approveTugas(tugasId, 'admin-1')).rejects.toThrow(
            new AppError('Tugas tidak ditemukan', 404)
        );
    });
});
