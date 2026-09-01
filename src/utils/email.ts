import path from "node:path";
import ejs from "ejs";
import { fileURLToPath } from "node:url";
import type { IEmailService } from "../services/email_service.interface.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function renderEmailTemplate(templateName: string, data: Record<string, unknown>): Promise<string> {
    const templatePath = path.join(__dirname, "../email", `${templateName}.ejs`);
    return ejs.renderFile(templatePath, data);
}

interface EmailSettings {
    appName: string | null;
    companyName: string | null;
    logoUrl: string | null;
}

export async function sendRenderedEmail(
    emailService: IEmailService,
    to: string,
    subject: string,
    templateName: string,
    templateData: Record<string, unknown>,
    fetchSettings?: () => Promise<EmailSettings>,
): Promise<void> {
    try {
        let appName = process.env.APP_NAME || null;
        let companyName = process.env.COMPANY_NAME || null;
        let logoUrl = process.env.LOGO_URL || null;

        if (fetchSettings) {
            const dbSettings = await fetchSettings();
            if (dbSettings.appName) appName = dbSettings.appName;
            if (dbSettings.companyName) companyName = dbSettings.companyName;
            if (dbSettings.logoUrl) logoUrl = dbSettings.logoUrl;
        }

        const html = await renderEmailTemplate(templateName, {
            appName: appName || "Aplikasi",
            companyName,
            logoUrl,
            ...templateData,
        });

        await emailService.send({ to, subject, html });
    } catch (err) {
        console.error(`Gagal kirim email ${templateName}: `, err);
    }
}