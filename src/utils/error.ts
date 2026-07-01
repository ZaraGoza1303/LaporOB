export class AppError extends Error {
    public statusCode: number;

    constructor (message: string, status_code: number) {
        super(message);
        this.statusCode = status_code;
    }
}

