import { describe, expect, it } from 'vitest';
import { sendSuccessfullResponse, sendErrorResponse } from '../../../utils/response.js';

describe('sendSuccessfullResponse', () => {
    it('membuat response sukses dengan data', async () => {
        const data = { id: '1' };

        expect(sendSuccessfullResponse('Berhasil', data)).toEqual({
            success: true,
            data: data,
            message: 'Berhasil',
        });
    });

    it('membuat response sukses tanpa data', async () => {
        expect(sendSuccessfullResponse('Berhasil')).toEqual({
            success: true,
            data: undefined,
            message: 'Berhasil',
        });
    });
});

describe('sendErrorResponse', () => {
    it('membuat response gagal dengan pesan saja', async () => {
        expect(sendErrorResponse('Gagal')).toEqual({
            success: false,
            message: 'Gagal',
            errors: undefined,
        });
    });

    it('membuat response gagal beserta detail errors', async () => {
        const errors = { nama: ['Wajib diisi'] };

        expect(sendErrorResponse('Validation Failed', errors)).toEqual({
            success: false,
            message: 'Validation Failed',
            errors: errors,
        });
    });
});
