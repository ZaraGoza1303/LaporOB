import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CloudStorageService } from '../../../services/cloud_storage_service';

const cloudService = new CloudStorageService();

function createFakeFile(): Express.Multer.File {
    return {
        fieldname: 'foto',
        originalname: 'foto.png',
        mimetype: 'image/png',
        size: 1000,
        buffer: Buffer.from('fake-image'),
    } as Express.Multer.File;
}

beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
});

describe('CloudStorageService.uploadFile', () => {
    it('mengembalikan mock url jika CLOUD_UPLOAD_URL tidak diset', async () => {
        vi.stubEnv('CLOUD_UPLOAD_URL', '');

        const url = await cloudService.uploadFile(createFakeFile());

        expect(url).toContain('https://cloud-storage.mock/uploads/');
        expect(url).toContain('foto.png');
    });

    it('mengupload via fetch dan mengembalikan url dari response', async () => {
        vi.stubEnv('CLOUD_UPLOAD_URL', 'https://upload.example.com');
        vi.stubEnv('CLOUD_UPLOAD_API_KEY', 'secret');
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ url: 'https://cdn.com/foto.png' }),
        }));

        const url = await cloudService.uploadFile(createFakeFile());

        expect(url).toBe('https://cdn.com/foto.png');
    });

    it('melempar AppError jika response cloud tidak ok', async () => {
        vi.stubEnv('CLOUD_UPLOAD_URL', 'https://upload.example.com');
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));

        await expect(cloudService.uploadFile(createFakeFile())).rejects.toThrow();
    });
});

describe('CloudStorageService.updateFile', () => {
    it('mengupload file baru dan menghapus file lama', async () => {
        vi.stubEnv('CLOUD_UPLOAD_URL', '');
        const deleteSpy = vi.spyOn(cloudService, 'deleteFile').mockResolvedValue(undefined);

        const url = await cloudService.updateFile(createFakeFile(), 'https://old.com/foto.png');

        expect(url).toContain('https://cloud-storage.mock/uploads/');
        expect(deleteSpy).toHaveBeenCalledWith('https://old.com/foto.png');
    });
});
