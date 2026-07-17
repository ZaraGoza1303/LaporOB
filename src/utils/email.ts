import path from "node:path";
import ejs from "ejs";
import { fileURLToPath } from "node:url";
import type { IEmailService } from "../services/email_service.interface.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function renderEmailTemplate(templateName: string, data: Record<string, unknown>): Promise<string> {
    const templatePath = path.join(__dirname, "../email", `${templateName}.ejs`);
    return ejs.renderFile(templatePath, data);
}

export async function sendRenderedEmail(emailService: IEmailService, to: string, subject: string, templateName: string, templateData: Record<string, unknown>): Promise<void> {
    try {
        const html = await renderEmailTemplate(templateName, {
            appName: process.env.APP_NAME || "LaporOB",
            companyName: process.env.COMPANY_NAME,
            ...templateData,
        });

        await emailService.send({ to, subject, html });
    } catch (err) {
        console.error(`Gagal kirim email ${templateName}: `, err);
    }
}