import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';
import type { IEmailService } from '../../../services/email_service.interface';
import { sendRenderedEmail } from '../../../utils/email';

const mockEmailService = mockDeep<IEmailService>();

beforeEach(() => {
    mockReset(mockEmailService);
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
});

describe('sendRenderedEmail', () => {
    it('mengirim email dengan template yang di-render', async () => {
        vi.stubEnv('APP_NAME', 'LaporOB');

        await sendRenderedEmail(
            mockEmailService,
            'farhan@gmail.com',
            'Aktivasi Akun',
            'activation',
            { userName: 'Farhan', activationUrl: 'http://x/activate?token=abc' }
        );

        expect(mockEmailService.send).toHaveBeenCalledWith({
            to: 'farhan@gmail.com',
            subject: 'Aktivasi Akun',
            html: expect.stringContaining('Farhan'),
        });
    });

    it('memakai fetchSettings jika diberikan', async () => {
        await sendRenderedEmail(
            mockEmailService,
            'farhan@gmail.com',
            'Subjek',
            'activation',
            { userName: 'Farhan', activationUrl: 'http://x' },
            async () => ({ appName: 'Dari DB', companyName: 'PT WGS', logoUrl: null })
        );

        expect(mockEmailService.send).toHaveBeenCalledWith({
            to: 'farhan@gmail.com',
            subject: 'Subjek',
            html: expect.stringContaining('Dari DB'),
        });
    });

    it('tidak melempar error jika template tidak ada', async () => {
        await expect(
            sendRenderedEmail(mockEmailService, 'a@gmail.com', 'Subjek', 'template-tidak-ada', {})
        ).resolves.toBeUndefined();
        expect(mockEmailService.send).not.toHaveBeenCalled();
    });
});
