export interface DateRangeResult {
    current_start: Date;
    current_end: Date;
    previous_start: Date;
    previous_end: Date;
}

export function calculateDateRanges(period: 'weekly' | 'monthly' | 'yearly'): DateRangeResult {
    const current_end = new Date();
    const current_start = new Date();
    
    const previous_end = new Date();
    const previous_start = new Date();

    if (period === 'weekly') {
        
        current_start.setDate(current_end.getDate() - 7);
        
        previous_end.setDate(current_start.getDate());
        previous_start.setDate(previous_end.getDate() - 7);
    } else if (period === 'monthly') {
        current_start.setDate(current_end.getDate() - 30);
        
        previous_end.setDate(current_start.getDate());
        previous_start.setDate(previous_end.getDate() - 30);
    } else {
        current_start.setFullYear(current_end.getFullYear() - 1);
        
        previous_end.setDate(current_start.getDate());
        previous_start.setFullYear(previous_end.getFullYear() - 1);
    }

    return { current_start, current_end, previous_start, previous_end };
}
