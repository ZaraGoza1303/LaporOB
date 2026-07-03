import type { IStorageService } from './storage_service.interface.js';
import { LocalStorageService } from './local_storage_service.js';
import { CloudStorageService } from './cloud_storage_service.js';

export class StorageServiceFactory {
    private static instance: IStorageService;

    static getProvider(): IStorageService {
        if (!this.instance) {
            const provider = process.env.STORAGE_PROVIDER || 'dev';

            if (provider.toLowerCase() === 'prod') {
                this.instance = new CloudStorageService();
            } else {
                this.instance = new LocalStorageService();
            }
        }

        return this.instance;
    }
}
