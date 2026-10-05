import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";
import { PrismaClient } from "../../../generated/prisma/client";
import { ChecklistHarianRepository } from "../../../repositories/checklistHarian_repository";
import { ChecklistHarianService } from "../../../services/checklistHarian_service";
import type { ISkillService } from "../../../services/skill_service.interface";
import type { IAchievementService } from "../../../services/achievement_service.interface";
import type { ChecklistHarianWithRelations } from "../../../repositories/checklistHarian_repository.interface";
import { AppError } from "../../../utils/error";

const mockDB = mockDeep<PrismaClient>();
const mockSkillService = mockDeep<ISkillService>();
const mockAchievementService = mockDeep<IAchievementService>();

const mockChecklistRepo = new ChecklistHarianRepository(mockDB);
const mockChecklistService = new ChecklistHarianService(mockChecklistRepo, mockSkillService, mockAchievementService);

beforeEach(() => {
    mockReset(mockDB);
    mockReset(mockSkillService);
    mockReset(mockAchievementService);
    vi.restoreAllMocks();
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
        kategori: { id: 'kat-1', nama_kategori: 'Kebersihan', created_at: new Date(), updated_at: new Date() },
        lantai: { id: 'lantai-1', lokasi_id: 'lokasi-1', nomor_lantai: 1, created_at: new Date(), updated_at: new Date(), lokasi: { id: 'lokasi-1', nama_lokasi: 'Gedung', alamat: null, created_at: new Date(), updated_at: new Date() } },
        ob: null,
        ...overrides,
    } as ChecklistHarianWithRelations;
}

describe('ChecklistHarianService.getAll', () => {
    it('mengembalikan semua checklist jika ob_id tidak dikirim', async () => {
        mockDB.checklist_harian.findMany.mockResolvedValue([createFakeChecklist()] as never);

        const data = await mockChecklistService.getAll();

        expect(data).toHaveLength(1);
        expect(data[0]?.total_durasi).toBeNull();
    });

    it('memfilter checklist milik ob jika ob_id dikirim', async () => {
        mockDB.checklist_harian.findMany.mockResolvedValue([
            createFakeChecklist({ ob_id: obId }),
            createFakeChecklist({ id: 'lain', ob_id: 'ob-lain' }),
        ] as never);

        const data = await mockChecklistService.getAll(obId);

        expect(data).toHaveLength(1);
        expect(data[0]?.ob_id).toBe(obId);
    });

    it('menghitung total_durasi jika sudah dikerjakan dan selesai', async () => {
        mockDB.checklist_harian.findMany.mockResolvedValue([
            createFakeChecklist({
                dikerjakan_at: new Date('2026-01-01T08:00:00Z'),
                selesai_at: new Date('2026-01-01T09:00:00Z'),
            }),
        ] as never);

        const data = await mockChecklistService.getAll();

        expect(data[0]?.total_durasi).toBe(3600);
    });
});

describe('ChecklistHarianService.getByID', () => {
    it('mengembalikan detail checklist', async () => {
        mockDB.checklist_harian.findFirst.mockResolvedValue(createFakeChecklist() as never);

        const data = await mockChecklistService.getByID(checklistId);

        expect(data?.id).toBe(checklistId);
    });

    it('mengembalikan null jika checklist tidak ditemukan', async () => {
        mockDB.checklist_harian.findFirst.mockResolvedValue(null);

        const data = await mockChecklistService.getByID('not-exist');

        expect(data).toBeNull();
    });

    it('melempar AppError 403 jika ob mengakses checklist milik orang lain', async () => {
        mockDB.checklist_harian.findFirst.mockResolvedValue(
            createFakeChecklist({ ob_id: 'ob-lain' }) as never
        );

        await expect(mockChecklistService.getByID(checklistId, obId)).rejects.toThrow(
            new AppError('Anda tidak memiliki akses ke checklist ini', 403)
        );
    });
});

describe('ChecklistHarianService.update', () => {
    it('mengupdate checklist dan memicu skill saat selesai', async () => {
        mockDB.checklist_harian.update.mockResolvedValue(createFakeChecklist() as never);
        mockDB.checklist_harian.findFirst.mockResolvedValue(createFakeChecklist() as never);

        await mockChecklistService.update(checklistId, { status: 'SELESAI' });

        expect(mockDB.checklist_harian.update).toHaveBeenCalledWith({
            where: { id: checklistId },
            data: expect.objectContaining({ status: 'SELESAI', selesai_at: expect.any(Date) }),
        });
        expect(mockSkillService.prosesSkillOtomatisForOb).toHaveBeenCalledWith(obId);
        expect(mockAchievementService.prosesOtomatisUntukOb).toHaveBeenCalledWith(obId);
    });

    it('tidak memicu skill jika status bukan selesai', async () => {
        mockDB.checklist_harian.update.mockResolvedValue(createFakeChecklist() as never);

        await mockChecklistService.update(checklistId, { nama_tugas: 'Baru' });

        expect(mockSkillService.prosesSkillOtomatisForOb).not.toHaveBeenCalled();
    });
});

describe('ChecklistHarianService.ambilChecklist', () => {
    it('ob berhasil mengambil checklist yang belum diambil', async () => {
        mockDB.checklist_harian.findFirst.mockResolvedValue(
            createFakeChecklist({ ob_id: null }) as never
        );
        mockDB.checklist_harian.update.mockResolvedValue(createFakeChecklist() as never);

        await mockChecklistService.ambilChecklist(checklistId, obId);

        expect(mockDB.checklist_harian.update).toHaveBeenCalledWith({
            where: { id: checklistId },
            data: { ob_id: obId },
        });
    });

    it('melempar AppError 404 jika checklist tidak ditemukan', async () => {
        mockDB.checklist_harian.findFirst.mockResolvedValue(null);

        await expect(mockChecklistService.ambilChecklist(checklistId, obId)).rejects.toThrow(
            new AppError('Checklist tidak ditemukan', 404)
        );
    });

    it('melempar AppError 409 jika checklist sudah diambil ob lain', async () => {
        mockDB.checklist_harian.findFirst.mockResolvedValue(createFakeChecklist() as never);

        await expect(mockChecklistService.ambilChecklist(checklistId, obId)).rejects.toThrow(
            new AppError('Checklist sudah diambil oleh OB lain', 409)
        );
    });
});
