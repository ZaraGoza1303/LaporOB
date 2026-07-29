import { createTransport, type Transporter } from "nodemailer";
import type { EmailPayload, IEmailService } from "./email_service.interface.js";
import type { TransporterConfig } from "../types/email.js";

export class EmailSmtpService implements IEmailService {
    private transporter: Transporter;

    constructor(config: TransporterConfig){
        this.transporter = createTransport({
            host: config.host,
            port: config.port,
            auth: {
                user: config.user,
                pass: config.pass,
            }
        })
    }

    async send(payload: EmailPayload): Promise<void> {
        await this.transporter.sendMail({
            from: payload.from,
            to: payload.to,
            subject: payload.subject,
            html: payload.html,
        })
    }
}