export type BaseResponse<T> = {
    success: boolean;
    data?: T | undefined;
    message?: string | undefined;
    errors?: T | undefined;
}

export type PaginatedResponse<T> =  {
    items: T[];
    next_cursor: string | null | undefined;
    meta?: {
        total_items: number;
        current_page: number;
        limit: number;
        total_pages: number;
    };
}