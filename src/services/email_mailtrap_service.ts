import type { EmailPayload, IEmailService } from "./email_service.interface.js";
import { MailtrapClient } from "mailtrap";

export class EmailMailtrapService implements IEmailService {
    private mailtrap: MailtrapClient;

    constructor(apiKey: string, testInboxId: number) {
        this.mailtrap = new MailtrapClient({
            token: apiKey,
            sandbox: true,       
            testInboxId: testInboxId,
        });
    }

    async send(payload: EmailPayload): Promise<void> {
        await this.mailtrap.send({
            from: {
                email: payload.from ?? process.env.MAILTRAP_SENDER ?? "no-reply@sandbox.com",
            },
            to: [{ email: payload.to }],
            subject: payload.subject,
            html: payload.html,
        });
    }
}