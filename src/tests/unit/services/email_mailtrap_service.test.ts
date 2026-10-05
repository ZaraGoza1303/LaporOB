import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EmailMailtrapService } from '../../../services/email_mailtrap_service';

beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
});

describe('EmailMailtrapService.send', () => {
    it('mengirim email via mailtrap client', async () => {
        const service = new EmailMailtrapService('api-key', 123);
        const sendMock = vi.spyOn((service as unknown as { mailtrap: { send: (args: unknown) => Promise<unknown> } }).mailtrap, 'send').mockResolvedValue({});

        await service.send({ to: 'farhan@gmail.com', subject: 'Halo', html: '<h1>Halo</h1>' });

        expect(sendMock).toHaveBeenCalledWith({
            from: { email: expect.any(String) },
            to: [{ email: 'farhan@gmail.com' }],
            subject: 'Halo',
            html: '<h1>Halo</h1>',
        });
    });

    it('memakai sender dari env jika from tidak diisi', async () => {
        vi.stubEnv('MAILTRAP_SENDER', 'custom@sandbox.com');
        const service = new EmailMailtrapService('api-key', 123);
        const sendMock = vi.spyOn((service as unknown as { mailtrap: { send: (args: unknown) => Promise<unknown> } }).mailtrap, 'send').mockResolvedValue({});

        await service.send({ to: 'a@gmail.com', subject: 'S', html: 'H' });

        expect(sendMock).toHaveBeenCalledWith(
            expect.objectContaining({ from: { email: 'custom@sandbox.com' } })
        );
    });
});
