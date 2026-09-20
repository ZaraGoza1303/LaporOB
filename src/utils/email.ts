import path from "node:path";
import ejs from "ejs";
import { fileURLToPath } from "node:url";
import type { IEmailService } from "../services/email_service.interface.js";
import { resolveFileUrl } from "./url.js";

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

// Map hasil settingService.getAll() ke bentuk yang dibutuhkan template email
export function toEmailSettings(settings: {
    app_name: string | null;
    company_name: string | null;
    logo_url: string | null;
}): EmailSettings {
    return {
        appName: settings.app_name,
        companyName: settings.company_name,
        logoUrl: settings.logo_url,
    };
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
        // Logo harus URL absolut, kalau tidak gambar tidak tampil di email client
        let logoUrl = resolveFileUrl(process.env.LOGO_URL);

        if (fetchSettings) {
            const dbSettings = await fetchSettings();
            if (dbSettings.appName) appName = dbSettings.appName;
            if (dbSettings.companyName) companyName = dbSettings.companyName;
            const dbLogoUrl = resolveFileUrl(dbSettings.logoUrl);
            if (dbLogoUrl) logoUrl = dbLogoUrl;
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