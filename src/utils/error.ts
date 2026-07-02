import { PrismaClientKnownRequestError } from "../generated/prisma/internal/prismaNamespace.js";

export class AppError extends Error {
    public statusCode: number;

    constructor (message: string, status_code: number) {
        super(message);
        this.statusCode = status_code;
    }
}

export function handlePrismaError(error: unknown): never {
    if (error instanceof PrismaClientKnownRequestError) {
        switch (error.code) {
            case "P2002": throw new AppError("Data already exists", 409);
            case "P2025": throw new AppError("Data not found", 404);
            case "P2003": throw new AppError("Related data not found", 404);
            default: throw new AppError(`Database error: ${error.code}`, 500);
        }
    }
    throw error;
}