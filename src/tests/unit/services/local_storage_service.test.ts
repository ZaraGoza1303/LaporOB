import { beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'fs/promises';
import { LocalStorageService } from '../../../services/local_storage_service';

vi.mock('fs/promises');

beforeEach(() => {
    vi.restoreAllMocks();
});

function createFakeFile(): Express.Multer.File {
    return {
        fieldname: 'foto',
        originalname: 'foto.png',
        mimetype: 'image/png',
        size: 1000,
        buffer: Buffer.from('fake'),
    } as Express.Multer.File;
}

describe('LocalStorageService.uploadFile', () => {
    it('menyimpan file dan mengembalikan relative path', async () => {
        vi.mocked(fs.mkdir).mockResolvedValue(undefined as never);
        vi.mocked(fs.writeFile).mockResolvedValue(undefined as never);
        const service = new LocalStorageService();

        const path = await service.uploadFile(createFakeFile());

        expect(path).toContain('uploads/');
        expect(path).toContain('.png');
        expect(fs.writeFile).toHaveBeenCalled();
    });
});

describe('LocalStorageService.updateFile', () => {
    it('mengupload file baru dan menghapus file lama', async () => {
        vi.mocked(fs.mkdir).mockResolvedValue(undefined as never);
        vi.mocked(fs.writeFile).mockResolvedValue(undefined as never);
        vi.mocked(fs.unlink).mockResolvedValue(undefined as never);
        const service = new LocalStorageService();
        const deleteSpy = vi.spyOn(service, 'deleteFile').mockResolvedValue(undefined);

        const path = await service.updateFile(createFakeFile(), 'uploads/lama.png');

        expect(path).toContain('uploads/');
        expect(deleteSpy).toHaveBeenCalledWith('uploads/lama.png');
    });
});

describe('LocalStorageService.deleteFile', () => {
    it('menghapus file dari full url', async () => {
        vi.mocked(fs.unlink).mockResolvedValue(undefined as never);
        const service = new LocalStorageService();

        await service.deleteFile('http://localhost:8000/uploads/foto.png');

        expect(fs.unlink).toHaveBeenCalledWith(expect.stringContaining('foto.png'));
    });

    it('tidak error jika file tidak ada', async () => {
        vi.mocked(fs.unlink).mockRejectedValue(new Error('not found'));
        const service = new LocalStorageService();

        await expect(service.deleteFile('uploads/foto.png')).resolves.toBeUndefined();
    });
});
