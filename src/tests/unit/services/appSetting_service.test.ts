import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";
import { AppSetting, PrismaClient } from "../../../generated/prisma/client";
import type { IRedisClient } from "../../../database/redis.interface";
import { AppSettingRepository } from "../../../repositories/appSetting_repository";
import { AppSettingService } from "../../../services/appSetting_service";
import type { AppSettingMap, IAppSettingService } from "../../../services/appSetting_service.interface";

const CACHE_KEY = "app:settings";
const CACHE_TTL = 300;

const mockDB = mockDeep<PrismaClient>();
const mockRedis = mockDeep<IRedisClient>();

const mockAppSettingRepo = new AppSettingRepository(mockDB);
const mockAppSettingService = new AppSettingService(mockAppSettingRepo, mockRedis);

beforeEach(() => {
    mockReset(mockDB);
    mockReset(mockRedis);
});

type UpsertSettingPayload = Parameters<IAppSettingService["upsert"]>[0];

// Fungsi generate fake data dan bisa juga override
function createFakeAppSettingRow(overrides?: Partial<AppSetting>): AppSetting {
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

// Fungsi generate fake data dan bisa juga override
function createFakeSettings(overrides?: Partial<AppSettingMap>): AppSettingMap {
    return {
        app_name: 'LaporOB',
        company_name: 'PT WGS',
        logo_url: 'uploads/wgs-logo.png',
        ...overrides,
    };
}

describe('AppSettingService.getAll', () => {
    it('mengembalikan pengaturan dari database dan menyimpannya ke cache jika cache kosong', async () => {
        const fakeSettings = createFakeSettings();

        mockRedis.get.mockResolvedValue(null);
        mockDB.appSetting.findMany.mockResolvedValue([
            createFakeAppSettingRow(),
            createFakeAppSettingRow({ key: 'company_name', value: 'PT WGS' }),
            createFakeAppSettingRow({ key: 'logo_url', value: 'uploads/wgs-logo.png' }),
        ]);

        const data = await mockAppSettingService.getAll();

        expect(mockRedis.get).toHaveBeenCalledWith(CACHE_KEY);
        expect(mockDB.appSetting.findMany).toHaveBeenCalledTimes(1);
        expect(mockRedis.setEx).toHaveBeenCalledWith(CACHE_KEY, CACHE_TTL, JSON.stringify(fakeSettings));
        expect(data).toEqual(fakeSettings);
    });

    it('mengembalikan pengaturan dari cache dan tidak menyentuh database jika cache hit', async () => {
        const cachedSettings = createFakeSettings({ app_name: 'LaporOB Cached' });

        mockRedis.get.mockResolvedValue(JSON.stringify(cachedSettings));

        const data = await mockAppSettingService.getAll();

        expect(data).toEqual(cachedSettings);
        expect(mockDB.appSetting.findMany).not.toHaveBeenCalled();
        expect(mockRedis.setEx).not.toHaveBeenCalled();
    });

    it('memakai default dari env jika pengaturan belum ada di database', async () => {
        vi.stubEnv('APP_NAME', 'LaporOB Env');
        vi.stubEnv('COMPANY_NAME', 'PT WGS Env');
        vi.stubEnv('LOGO_URL', '/uploads/wgs-logo-env.png');

        mockRedis.get.mockResolvedValue(null);
        mockDB.appSetting.findMany.mockResolvedValue([]);

        const data = await mockAppSettingService.getAll();

        expect(data).toEqual({
            app_name: 'LaporOB Env',
            company_name: 'PT WGS Env',
            logo_url: '/uploads/wgs-logo-env.png',
        });
    });

    it('melewati baris yang valuenya null lalu memakai default env', async () => {
        vi.stubEnv('APP_NAME', 'LaporOB Env');
        vi.stubEnv('COMPANY_NAME', 'PT WGS Env');
        vi.stubEnv('LOGO_URL', '/uploads/wgs-logo-env.png');

        mockRedis.get.mockResolvedValue(null);
        mockDB.appSetting.findMany.mockResolvedValue([
            createFakeAppSettingRow({ key: 'app_name', value: null }),
            createFakeAppSettingRow({ key: 'company_name', value: 'PT WGS' }),
        ]);

        const data = await mockAppSettingService.getAll();

        expect(data).toEqual({
            app_name: 'LaporOB Env',
            company_name: 'PT WGS',
            logo_url: '/uploads/wgs-logo-env.png',
        });
    });

    it('mengembalikan null dan tetap mengisi cache jika pengaturan dan env sama-sama kosong', async () => {
        vi.stubEnv('APP_NAME', undefined);
        vi.stubEnv('COMPANY_NAME', undefined);
        vi.stubEnv('LOGO_URL', undefined);

        mockRedis.get.mockResolvedValue(null);
        mockDB.appSetting.findMany.mockResolvedValue([]);

        const data = await mockAppSettingService.getAll();

        expect(data).toEqual({ app_name: null, company_name: null, logo_url: null });
        expect(mockRedis.setEx).toHaveBeenCalledWith(
            CACHE_KEY,
            CACHE_TTL,
            JSON.stringify({ app_name: null, company_name: null, logo_url: null })
        );
    });

    it('mengabaikan key pengaturan yang tidak dikenal', async () => {
        vi.stubEnv('APP_NAME', undefined);
        vi.stubEnv('COMPANY_NAME', undefined);
        vi.stubEnv('LOGO_URL', undefined);

        mockRedis.get.mockResolvedValue(null);
        mockDB.appSetting.findMany.mockResolvedValue([
            createFakeAppSettingRow({ key: 'secret_key', value: 'jangan-disimpan' }),
        ]);

        const data = await mockAppSettingService.getAll();

        expect(data).toEqual({ app_name: null, company_name: null, logo_url: null });
        expect(data).not.toHaveProperty('secret_key');
    });
});

describe('AppSettingService.getStoredLogoUrl', () => {
    it('mengembalikan logo_url yang tersimpan di database', async () => {
        mockDB.appSetting.findMany.mockResolvedValue([
            createFakeAppSettingRow({ key: 'app_name', value: 'LaporOB' }),
            createFakeAppSettingRow({ key: 'logo_url', value: 'uploads/wgs-logo.png' }),
        ]);

        const data = await mockAppSettingService.getStoredLogoUrl();

        expect(mockDB.appSetting.findMany).toHaveBeenCalledWith({ select: { key: true, value: true } });
        expect(data).toBe('uploads/wgs-logo.png');
    });

    it('mengembalikan null jika pengaturan logo belum pernah disimpan', async () => {
        mockDB.appSetting.findMany.mockResolvedValue([createFakeAppSettingRow()]);

        const data = await mockAppSettingService.getStoredLogoUrl();

        expect(data).toBeNull();
    });

    it('mengembalikan null jika value logo_url tersimpan sebagai null', async () => {
        mockDB.appSetting.findMany.mockResolvedValue([
            createFakeAppSettingRow({ key: 'logo_url', value: null }),
        ]);

        const data = await mockAppSettingService.getStoredLogoUrl();

        expect(data).toBeNull();
    });
});

describe('AppSettingService.upsert', () => {
    it('menyimpan semua key yang diizinkan dan membersihkan cache', async () => {
        await mockAppSettingService.upsert({
            app_name: 'LaporOB',
            company_name: 'PT WGS',
            logo_url: 'uploads/wgs-logo.png',
        });

        expect(mockDB.appSetting.upsert).toHaveBeenCalledTimes(3);
        expect(mockDB.appSetting.upsert).toHaveBeenNthCalledWith(1, {
            where: { key: 'app_name' },
            create: { key: 'app_name', value: 'LaporOB' },
            update: { value: 'LaporOB' },
        });
        expect(mockDB.appSetting.upsert).toHaveBeenNthCalledWith(2, {
            where: { key: 'company_name' },
            create: { key: 'company_name', value: 'PT WGS' },
            update: { value: 'PT WGS' },
        });
        expect(mockDB.appSetting.upsert).toHaveBeenNthCalledWith(3, {
            where: { key: 'logo_url' },
            create: { key: 'logo_url', value: 'uploads/wgs-logo.png' },
            update: { value: 'uploads/wgs-logo.png' },
        });
        expect(mockRedis.del).toHaveBeenCalledWith(CACHE_KEY);
    });

    it('mengabaikan key yang tidak termasuk pengaturan yang diizinkan', async () => {
        const payload = {
            app_name: 'LaporOB',
            tidak_dikenal: 'jangan-disimpan',
        } as unknown as UpsertSettingPayload;

        await mockAppSettingService.upsert(payload);

        expect(mockDB.appSetting.upsert).toHaveBeenCalledTimes(1);
        expect(mockDB.appSetting.upsert).toHaveBeenCalledWith({
            where: { key: 'app_name' },
            create: { key: 'app_name', value: 'LaporOB' },
            update: { value: 'LaporOB' },
        });
        expect(mockRedis.del).toHaveBeenCalledWith(CACHE_KEY);
    });

    it('mengirim value null untuk mereset pengaturan', async () => {
        await mockAppSettingService.upsert({ logo_url: null });

        expect(mockDB.appSetting.upsert).toHaveBeenCalledWith({
            where: { key: 'logo_url' },
            create: { key: 'logo_url', value: null },
            update: { value: null },
        });
    });

    it('tidak menyimpan key yang nilainya undefined', async () => {
        await mockAppSettingService.upsert({ app_name: undefined, company_name: 'PT WGS' });

        expect(mockDB.appSetting.upsert).toHaveBeenCalledTimes(1);
        expect(mockDB.appSetting.upsert).toHaveBeenCalledWith({
            where: { key: 'company_name' },
            create: { key: 'company_name', value: 'PT WGS' },
            update: { value: 'PT WGS' },
        });
    });

    it('tetap membersihkan cache walau tidak ada key yang dikirim', async () => {
        await mockAppSettingService.upsert({});

        expect(mockDB.appSetting.upsert).not.toHaveBeenCalled();
        expect(mockRedis.del).toHaveBeenCalledWith(CACHE_KEY);
    });
});
