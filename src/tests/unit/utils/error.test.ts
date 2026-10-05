import { describe, expect, it } from 'vitest';
import { AppError, handlePrismaError } from '../../../utils/error.js';
import { PrismaClientKnownRequestError, PrismaClientValidationError } from '../../../generated/prisma/internal/prismaNamespace.js';

describe('AppError', () => {
    it('menyimpan pesan dan status code', async () => {
        const err = new AppError('Gagal', 422);

        expect(err.message).toBe('Gagal');
        expect(err.statusCode).toBe(422);
        expect(err).toBeInstanceOf(Error);
    });
});

describe('handlePrismaError', () => {
    it('melempar AppError 409 untuk kode P2002', async () => {
        const prismaErr = new PrismaClientKnownRequestError('unique', { code: 'P2002', clientVersion: 'test' });

        expect(() => handlePrismaError(prismaErr)).toThrow(
            expect.objectContaining({ message: 'Data already exists' })
        );
    });

    it('melempar AppError 404 untuk kode P2025', async () => {
        const prismaErr = new PrismaClientKnownRequestError('not found', { code: 'P2025', clientVersion: 'test' });

        expect(() => handlePrismaError(prismaErr)).toThrow(
            expect.objectContaining({ message: 'Data not found' })
        );
    });

    it('melempar ulang error asli jika bukan prisma error', async () => {
        const err = new Error('boom');

        expect(() => handlePrismaError(err)).toThrow('boom');
    });

    it('melempar ulang AppError apa adanya', async () => {
        const err = new AppError('Sudah ada', 409);

        expect(() => handlePrismaError(err)).toThrow(err);
    });
});
