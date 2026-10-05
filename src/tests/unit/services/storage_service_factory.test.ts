import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StorageServiceFactory } from '../../../services/storage_service.factory';
import { LocalStorageService } from '../../../services/local_storage_service';
import { CloudStorageService } from '../../../services/cloud_storage_service';

describe('StorageServiceFactory.getProvider', () => {
    it('mengembalikan LocalStorageService jika provider local', async () => {
        vi.stubEnv('STORAGE_PROVIDER', 'local');
        (StorageServiceFactory as unknown as { instance: undefined }).instance = undefined;

        const provider = StorageServiceFactory.getProvider();

        expect(provider).toBeInstanceOf(LocalStorageService);
    });

    it('mengembalikan CloudStorageService jika provider cloud', async () => {
        vi.stubEnv('STORAGE_PROVIDER', 'cloud');
        (StorageServiceFactory as unknown as { instance: undefined }).instance = undefined;

        const provider = StorageServiceFactory.getProvider();

        expect(provider).toBeInstanceOf(CloudStorageService);
    });

    it('mengembalikan instance yang sama setiap dipanggil', async () => {
        vi.stubEnv('STORAGE_PROVIDER', 'local');
        (StorageServiceFactory as unknown as { instance: undefined }).instance = undefined;

        const first = StorageServiceFactory.getProvider();
        const second = StorageServiceFactory.getProvider();

        expect(first).toBe(second);
    });
});
