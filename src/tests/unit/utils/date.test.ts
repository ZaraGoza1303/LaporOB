import { describe, expect, it } from 'vitest';
import { calculatePeriodRange, calculateDateRanges } from '../../../utils/date.js';

describe('calculatePeriodRange', () => {
    it('membuat rentang harian dari jam 00:00 sampai 23:59', async () => {
        const range = calculatePeriodRange('harian');

        expect(range.start.getHours()).toBe(0);
        expect(range.start.getMinutes()).toBe(0);
        expect(range.end.getHours()).toBe(23);
        expect(range.end.getMinutes()).toBe(59);
        expect(range.start.toDateString()).toBe(range.end.toDateString());
    });

    it('membuat rentang mingguan 7 hari ke belakang', async () => {
        const range = calculatePeriodRange('mingguan');
        const selisih = range.end.getTime() - range.start.getTime();

        expect(selisih).toBeGreaterThanOrEqual(7 * 24 * 3600 * 1000 - 1000);
        expect(range.start.getTime()).toBeLessThanOrEqual(range.end.getTime());
    });

    it('membuat rentang bulanan 30 hari ke belakang', async () => {
        const range = calculatePeriodRange('bulanan');
        const selisih = range.end.getTime() - range.start.getTime();

        expect(selisih).toBeGreaterThanOrEqual(30 * 24 * 3600 * 1000 - 5000);
    });

    it('membuat rentang tahunan 1 tahun ke belakang', async () => {
        const range = calculatePeriodRange('tahunan');

        expect(range.end.getFullYear() - range.start.getFullYear()).toBeGreaterThanOrEqual(0);
        expect(range.start.getTime()).toBeLessThanOrEqual(range.end.getTime());
    });
});

describe('calculateDateRanges', () => {
    it('membuat current dan previous untuk periode harian', async () => {
        const range = calculateDateRanges('harian');

        expect(range.current_start.getTime()).toBeLessThanOrEqual(range.current_end.getTime());
        expect(range.previous_start.getTime()).toBeLessThanOrEqual(range.previous_end.getTime());
        expect(range.previous_end.getTime()).toBeLessThanOrEqual(range.current_end.getTime());
    });

    it('membuat current dan previous untuk periode mingguan', async () => {
        const range = calculateDateRanges('mingguan');

        expect(range.current_start.getTime()).toBeLessThanOrEqual(range.current_end.getTime());
        expect(range.previous_start.getTime()).toBeLessThanOrEqual(range.previous_end.getTime());
    });

    it('membuat current dan previous untuk periode bulanan', async () => {
        const range = calculateDateRanges('bulanan');

        expect(range.current_start.getTime()).toBeLessThanOrEqual(range.current_end.getTime());
        expect(range.previous_start.getTime()).toBeLessThanOrEqual(range.previous_end.getTime());
    });

    it('membuat current dan previous untuk periode tahunan', async () => {
        const range = calculateDateRanges('tahunan');

        expect(range.current_start.getTime()).toBeLessThanOrEqual(range.current_end.getTime());
        expect(range.previous_start.getTime()).toBeLessThanOrEqual(range.previous_end.getTime());
    });
});
