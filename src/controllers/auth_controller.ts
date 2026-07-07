import type { Request, Response } from "express";
import { LoginSchema } from "../dto/auth.js";
import { sendErrorResponse, sendSuccessfullResponse } from "../utils/response.js";
import type { IAuthService } from "../services/auth_service.interface.js";
import { AppError } from "../utils/error.js";

export class AuthController {
    private authService: IAuthService

    constructor(authService: IAuthService) {
        this.authService = authService
    }

    async login(req: Request, res: Response) {
        try {
            if (!req.body) {
                return res.status(400).json(sendErrorResponse("Request body empty"))
            };

            const validate = LoginSchema.safeParse(req.body);
            if (!validate.success) {
                const formattedErr = validate.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr))
            }

            const response = await this.authService.login(validate.data);
            return res.status(200).json(sendSuccessfullResponse("Login Berhasil", response))
        } catch (err: any) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Login Gagal", err.message))
        }
    }

    async loginActivation(req: Request, res: Response) {
        try {
            const activationToken = req.query.token as string;

            if (!req.body) {
                return res.status(400).json(sendErrorResponse("Request body empty"))
            };

            const validate = LoginSchema.safeParse(req.body);
            if (!validate.success) {
                const formattedErr = validate.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr))
            }

            await this.authService.loginActivation(validate.data, activationToken);
            return res.status(200).json(sendSuccessfullResponse("Login aktivasi Berhasil"))
        } catch (err: any) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Login Gagal", err.message))
        }
    }

    async verifyActivation(req: Request, res: Response) {
        try {
            const token = req.query.token as string;
            if (!token) {
                return res.status(400).json(sendErrorResponse("Token required"));
            }
            await this.authService.validateActivationToken(token);
            return res.status(200).json(sendSuccessfullResponse("Token valid"));
        } catch (err: any) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message));
            }
            return res.status(400).json(sendErrorResponse("Token tidak valid atau expired", err.message));
        }
    }

}