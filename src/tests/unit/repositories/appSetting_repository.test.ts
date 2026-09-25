import { beforeEach, describe, expect, it } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';
import { AppSetting, PrismaClient } from '../../../generated/prisma/client.js';
import { AppSettingRepository } from '../../../repositories/appSetting_repository.js';

const mockDB = mockDeep<PrismaClient>();
const mockAppSettingRepo = new AppSettingRepository(mockDB);

beforeEach(() => {
    mockReset(mockDB);
});

// Fungsi generate fake data dan bisa juga override
function createFakeAppSetting(overrides?: Partial<AppSetting>): AppSetting {
    return {
        id: 'b7c8d9e0-1f2a-4b3c-9d4e-5f6a7b8c9d0e',
        key: 'app_name',
        value: 'LaporOB',
        type: 'text',
        created_at: new Date('2026-01-01T00:00:00Z'),
        updated_at: new Date('2026-01-01T00:00:00Z'),
        ...overrides,
    };
}

describe('AppSettingRepository.getAll', () => {
    it('mengembalikan semua pengaturan dengan select key dan value saja', async () => {
        const fakeRows: AppSetting[] = [
            createFakeAppSetting(),
            createFakeAppSetting({ key: 'company_name', value: 'PT WGS' }),
            createFakeAppSetting({ key: 'logo_url', value: 'uploads/wgs-logo.png' }),
        ];

        mockDB.appSetting.findMany.mockResolvedValue(fakeRows);

        const data = await mockAppSettingRepo.getAll();

        expect(mockDB.appSetting.findMany).toHaveBeenCalledWith({
            select: { key: true, value: true },
        });
        expect(data).toEqual(fakeRows);
    });

    it('mengembalikan array kosong jika belum ada pengaturan yang disimpan', async () => {
        mockDB.appSetting.findMany.mockResolvedValue([]);

        const data = await mockAppSettingRepo.getAll();

        expect(data).toEqual([]);
    });
});

describe('AppSettingRepository.upsert', () => {
    it('membuat baris baru jika key pengaturan belum ada', async () => {
        mockDB.appSetting.upsert.mockResolvedValue(createFakeAppSetting());

        await mockAppSettingRepo.upsert('app_name', 'LaporOB');

        expect(mockDB.appSetting.upsert).toHaveBeenCalledWith({
            where: { key: 'app_name' },
            create: { key: 'app_name', value: 'LaporOB' },
            update: { value: 'LaporOB' },
        });
    });

    it('mengupdate value jika key pengaturan sudah ada', async () => {
        mockDB.appSetting.upsert.mockResolvedValue(createFakeAppSetting({ value: 'LaporOB Baru' }));

        await mockAppSettingRepo.upsert('app_name', 'LaporOB Baru');

        expect(mockDB.appSetting.upsert).toHaveBeenCalledWith({
            where: { key: 'app_name' },
            create: { key: 'app_name', value: 'LaporOB Baru' },
            update: { value: 'LaporOB Baru' },
        });
    });

    it('mengirim value null untuk mereset pengaturan', async () => {
        mockDB.appSetting.upsert.mockResolvedValue(createFakeAppSetting({ key: 'logo_url', value: null }));

        await mockAppSettingRepo.upsert('logo_url', null);

        expect(mockDB.appSetting.upsert).toHaveBeenCalledWith({
            where: { key: 'logo_url' },
            create: { key: 'logo_url', value: null },
            update: { value: null },
        });
    });
});
