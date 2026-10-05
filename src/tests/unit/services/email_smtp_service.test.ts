import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EmailSmtpService } from '../../../services/email_smtp_service';
import * as nodemailer from 'nodemailer';

vi.mock('nodemailer');

beforeEach(() => {
    vi.restoreAllMocks();
});

describe('EmailSmtpService.send', () => {
    it('mengirim email via transporter', async () => {
        const sendMailMock = vi.fn().mockResolvedValue({});
        vi.mocked(nodemailer.createTransport).mockReturnValue({ sendMail: sendMailMock } as never);

        const service = new EmailSmtpService({ host: 'smtp.gmail.com', port: 587, user: 'u', pass: 'p' });

        await service.send({ to: 'farhan@gmail.com', subject: 'Halo', html: '<h1>Halo</h1>' });

        expect(sendMailMock).toHaveBeenCalledWith({
            from: undefined,
            to: 'farhan@gmail.com',
            subject: 'Halo',
            html: '<h1>Halo</h1>',
        });
    });
});
