import { jadwalChecklistService } from '../container.js';

export const jobGenerateChecklistHarian = async (trigger: string): Promise<void> => {
    try {
        const count = await jadwalChecklistService.generateToday();
        if (count > 0) console.log(`[CRON] (${trigger}) Generated ${count} daily checklists`);
    } catch (err) {
        console.error(`[CRON] (${trigger}) Gagal generate checklist harian:`, err);
    }
};
