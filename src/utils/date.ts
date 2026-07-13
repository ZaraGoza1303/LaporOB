export type Period = 'harian' | 'mingguan' | 'bulanan' | 'tahunan';

export interface DateRangeResult {
    current_start: Date;
    current_end: Date;
    previous_start: Date;
    previous_end: Date;
}

export interface PeriodRange {
    start: Date;
    end: Date;
}

export function calculatePeriodRange(period: Period): PeriodRange {
    const now = new Date();

    if (period === 'harian') {
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        const end = new Date(now);
        end.setHours(23, 59, 59, 999);
        return { start, end };
    }

    if (period === 'mingguan') {
        const start = new Date(now);
        start.setDate(now.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        return { start, end: now };
    }

    if (period === 'bulanan') {
        const start = new Date(now);
        start.setDate(now.getDate() - 30);
        start.setHours(0, 0, 0, 0);
        return { start, end: now };
    }

    // tahunan
    const start = new Date(now);
    start.setFullYear(now.getFullYear() - 1);
    start.setHours(0, 0, 0, 0);
    return { start, end: now };
}

export function calculateDateRanges(period: Period): DateRangeResult {
    const current_end = new Date();
    const current_start = new Date();

    const previous_end = new Date();
    const previous_start = new Date();

    if (period === 'mingguan') {
        current_start.setDate(current_end.getDate() - 7);
        previous_end.setDate(current_start.getDate());
        previous_start.setDate(previous_end.getDate() - 7);
    } else if (period === 'harian') {
        current_start.setHours(0, 0, 0, 0);
        previous_end.setDate(current_end.getDate() - 1);
        previous_end.setHours(23, 59, 59, 999);
        previous_start.setDate(current_end.getDate() - 1);
        previous_start.setHours(0, 0, 0, 0);
    } else if (period === 'bulanan') {
        current_start.setDate(current_end.getDate() - 30);
        previous_end.setDate(current_start.getDate());
        previous_start.setDate(previous_end.getDate() - 30);
    } else {
        // tahunan
        current_start.setFullYear(current_end.getFullYear() - 1);
        previous_end.setDate(current_start.getDate());
        previous_start.setFullYear(previous_end.getFullYear() - 1);
    }

    return { current_start, current_end, previous_start, previous_end };
}
