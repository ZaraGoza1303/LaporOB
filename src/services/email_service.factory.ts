import { EmailMailtrapService } from "./email_mailtrap_service.js";
import type { IEmailService } from "./email_service.interface.js";
import { EmailSmtpService } from "./email_smtp_service.js";

export class EmailServiceFactory {
    private static instance: IEmailService;

    static getProvider(): IEmailService {
        if (this.instance) {
            return this.instance;
        }

        const provider = process.env.EMAIL_DRIVER;

        switch(provider) {
            case "mailtrap":
                const apiKey = process.env.MAILTRAP_API_KEY;
                const inboxId = process.env.MAILTRAP_INBOX_ID;
                if (!apiKey) throw new Error("MAILTRAP_API_KEY is not set");
                if (!inboxId) throw new Error("MAILTRAP_INBOX_ID is not set");

                this.instance = new EmailMailtrapService(apiKey, Number(inboxId));
                break;

            case "gmail":
                this.instance = new EmailSmtpService({
                    host: process.env.SMTP_HOST || "",
                    port: Number(process.env.SMTP_PORT) || 587,
                    user: process.env.SMTP_USER || "",
                    pass: process.env.SMTP_PASS || "",
                });
                break; 

            default :
                throw new Error(`Unknown or unset EMAIL_DRIVER: "${provider}". Set it to "mailtrap" or "smtp" in .env`);
        }

        return this.instance
    }
}