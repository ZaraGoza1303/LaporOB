import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EmailServiceFactory } from '../../../services/email_service.factory';
import { EmailSmtpService } from '../../../services/email_smtp_service';

describe('EmailServiceFactory.getProvider', () => {
    it('mengembalikan EmailSmtpService jika driver gmail', async () => {
        vi.stubEnv('EMAIL_DRIVER', 'gmail');
        (EmailServiceFactory as unknown as { instance: undefined }).instance = undefined;

        const provider = EmailServiceFactory.getProvider();

        expect(provider).toBeInstanceOf(EmailSmtpService);
    });

    it('mengembalikan instance yang sama setiap dipanggil', async () => {
        vi.stubEnv('EMAIL_DRIVER', 'gmail');
        (EmailServiceFactory as unknown as { instance: undefined }).instance = undefined;

        const first = EmailServiceFactory.getProvider();
        const second = EmailServiceFactory.getProvider();

        expect(first).toBe(second);
    });

    it('melempar error jika driver tidak dikenal', async () => {
        vi.stubEnv('EMAIL_DRIVER', 'unknown-driver');
        (EmailServiceFactory as unknown as { instance: undefined }).instance = undefined;

        expect(() => EmailServiceFactory.getProvider()).toThrow();
    });
});
