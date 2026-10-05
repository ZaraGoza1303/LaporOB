import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";
import { PrismaClient, JadwalChecklist } from "../../../generated/prisma/client";
import { JadwalChecklistRepository } from "../../../repositories/jadwalChecklist_repository";
import { JadwalChecklistService } from "../../../services/jadwalChecklist_service";
import type { IChecklistHarianService } from "../../../services/checklistHarian_service.interface";
import type { INotificationService } from "../../../services/notification_service.interface";
import type { IUsersService } from "../../../services/users_service.interface";

const mockDB = mockDeep<PrismaClient>();
const mockChecklistService = mockDeep<IChecklistHarianService>();
const mockNotificationService = mockDeep<INotificationService>();
const mockUsersService = mockDeep<IUsersService>();

const mockJadwalRepo = new JadwalChecklistRepository(mockDB);
const mockJadwalService = new JadwalChecklistService(
    mockJadwalRepo,
    mockChecklistService,
    mockNotificationService,
    mockUsersService
);

beforeEach(() => {
    mockReset(mockDB);
    mockReset(mockChecklistService);
    mockReset(mockNotificationService);
    mockReset(mockUsersService);
    vi.restoreAllMocks();
});

const jadwalId = '3f2a1b7c-9d4e-4a51-8c6f-1d2e3f4a5b6c';
const userId = '852a6e0e-1bcf-4578-b93b-46f893544bfc';

// Fungsi generate fake data dan bisa juga override
function createFakeJadwal(overrides?: Partial<JadwalChecklist>): JadwalChecklist {
    return {
        id: jadwalId,
        nama_tugas: 'Sapu Lantai',
        lantai_id: 'e2fbdc6f-ec0d-4547-a51d-a81b69741ed2',
        kategori_id: 'f6e0481d-67d4-449b-b3dc-376e72bdcf28',
        ob_id: null,
        hari: ['senin'],
        created_at: new Date('2026-01-01T00:00:00Z'),
        updated_at: new Date('2026-01-01T00:00:00Z'),
        ...overrides,
    };
}

describe('JadwalChecklistService.getAll', () => {
    it('mengembalikan semua jadwal', async () => {
        const fakeJadwals = [createFakeJadwal()];
        mockDB.jadwalChecklist.findMany.mockResolvedValue(fakeJadwals);

        const data = await mockJadwalService.getAll();

        expect(data).toEqual(fakeJadwals);
    });
});

describe('JadwalChecklistService.getByID', () => {
    it('mengembalikan jadwal sesuai id', async () => {
        const fakeJadwal = createFakeJadwal();
        mockDB.jadwalChecklist.findFirst.mockResolvedValue(fakeJadwal);

        const data = await mockJadwalService.getByID(jadwalId);

        expect(data).toEqual(fakeJadwal);
    });

    it('mengembalikan null jika jadwal tidak ditemukan', async () => {
        mockDB.jadwalChecklist.findFirst.mockResolvedValue(null);

        const data = await mockJadwalService.getByID('not-exist');

        expect(data).toBeNull();
    });
});

describe('JadwalChecklistService.update', () => {
    it('hanya mengirim field yang diisi', async () => {
        mockDB.jadwalChecklist.update.mockResolvedValue(createFakeJadwal());

        await mockJadwalService.update(jadwalId, { nama_tugas: 'Pel Lantai' });

        expect(mockDB.jadwalChecklist.update).toHaveBeenCalledWith({
            where: { id: jadwalId },
            data: { nama_tugas: 'Pel Lantai' },
        });
    });
});

describe('JadwalChecklistService.delete', () => {
    it('menghapus jadwal sesuai id', async () => {
        mockDB.jadwalChecklist.delete.mockResolvedValue(createFakeJadwal());

        await mockJadwalService.delete(jadwalId);

        expect(mockDB.jadwalChecklist.delete).toHaveBeenCalledWith({
            where: { id: jadwalId },
        });
    });
});

describe('JadwalChecklistService.generateToday', () => {
    it('mengembalikan 0 jika tidak ada jadwal yang cocok hari ini', async () => {
        mockDB.jadwalChecklist.findMany.mockResolvedValue([]);

        const data = await mockJadwalService.generateToday();

        expect(data).toBe(0);
        expect(mockChecklistService.insertFromJadwal).not.toHaveBeenCalled();
    });

    it('membuat checklist dan mengirim notifikasi untuk jadwal baru', async () => {
        const fakeJadwal = createFakeJadwal();
        mockDB.jadwalChecklist.findMany.mockResolvedValue([fakeJadwal]);
        mockChecklistService.getExistingInstanceKeys.mockResolvedValue([]);
        mockUsersService.getByRole.mockResolvedValue([{ id: 'ob-1' }] as never);

        const data = await mockJadwalService.generateToday();

        expect(mockChecklistService.insertFromJadwal).toHaveBeenCalledWith(fakeJadwal);
        expect(mockNotificationService.sendBulkNotification).toHaveBeenCalled();
        expect(data).toBe(1);
    });

    it('melewati jadwal yang sudah pernah dibuat hari ini', async () => {
        const fakeJadwal = createFakeJadwal();
        mockDB.jadwalChecklist.findMany.mockResolvedValue([fakeJadwal]);
        mockChecklistService.getExistingInstanceKeys.mockResolvedValue([
            { nama_tugas: fakeJadwal.nama_tugas, lantai_id: fakeJadwal.lantai_id, ob_id: fakeJadwal.ob_id },
        ]);

        const data = await mockJadwalService.generateToday();

        expect(mockChecklistService.insertFromJadwal).not.toHaveBeenCalled();
        expect(data).toBe(0);
    });
});
