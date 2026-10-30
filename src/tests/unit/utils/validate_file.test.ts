import { describe, expect, it, vi } from 'vitest';
import { validateImageFile, compressImageIfNeeded } from '../../../utils/validate_file.js';

function createFakeFile(overrides?: Partial<Express.Multer.File>): Express.Multer.File {
    return {
        fieldname: 'foto_masalah',
        originalname: 'foto.png',
        mimetype: 'image/png',
        size: 500 * 1024,
        buffer: Buffer.from('fake-image-buffer'),
        ...overrides,
    } as Express.Multer.File;
}

describe('validateImageFile', () => {
    it('menolak file lebih dari batas upload 15MB', async () => {
        const file = createFakeFile({ size: 16 * 1024 * 1024 });

        const result = await validateImageFile(file);

        expect(result).toEqual({ ok: false, message: 'Ukuran gambar maksimal adalah 15MB' });
    });
});

describe('compressImageIfNeeded', () => {
    it('mengembalikan file apa adanya jika ukuran di bawah ambang kompresi 1MB', async () => {
        const file = createFakeFile({ size: 500 * 1024 });

        const result = await compressImageIfNeeded(file);

        expect(result).toBe(file);
    });
});
