import { skillService, achievementService } from '../container.js';

export const jobUnlockSkillDanAchievement = async (trigger: string): Promise<void> => {
    try {
        const skillCount = await skillService.prosesSkillOtomatis();
        if (skillCount > 0) console.log(`[CRON] (${trigger}) Unlocked ${skillCount} new OB skills`);
    } catch (err) {
        console.error(`[CRON] (${trigger}) Gagal unlock skill OB:`, err);
    }

    try {
        const achievementCount = await achievementService.prosesOtomatis();
        if (achievementCount > 0) console.log(`[CRON] (${trigger}) Unlocked ${achievementCount} new OB achievements`);
    } catch (err) {
        console.error(`[CRON] (${trigger}) Gagal unlock achievement OB:`, err);
    }
};
