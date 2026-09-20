import cron from 'node-cron';
import { jobGenerateChecklistHarian } from './checklist_cron.js';
import { jobUnlockSkillDanAchievement } from './skillAchievement_cron.js';

export const initCron = (): void => {
    cron.schedule('0 0 * * *', () => jobGenerateChecklistHarian('cron 00:00'));
    cron.schedule('0 1 * * *', () => jobUnlockSkillDanAchievement('cron 01:00'));
};
