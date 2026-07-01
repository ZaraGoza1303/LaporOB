import type { BaseResponse } from "../dto/response.js";

export const sendSuccessfullResponse = <T>(message?: string, data?: T): BaseResponse<T> => {
    return {
        success: true,
        data: data,
        message: message,
    }
}

export const sendErrorResponse = <T>(message?: string, errors?: T): BaseResponse<T> => {
    return {
        success: false,
        message: message,
        errors: errors
    }
}