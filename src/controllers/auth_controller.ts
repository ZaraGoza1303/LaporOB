import type { Request, Response } from "express";
import { ActivateAccountSchema, LoginSchema, TokenQuerySchema } from "../dto/auth.js";
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

            const deviceInfo = req.headers['user-agent'] || null;
            const ipAddress = req.ip || req.socket.remoteAddress || null;

            const response = await this.authService.login(validate.data, deviceInfo, ipAddress);
            return res.status(200).json(sendSuccessfullResponse("Login Berhasil", response))
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Login Gagal"))
        }
    }

    async verifyActivation(req: Request, res: Response) {
        try {
            const validateQuery = TokenQuerySchema.safeParse(req.query);
            if (!validateQuery.success) {
                const formattedErr = validateQuery.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr));
            }
            const token = validateQuery.data.token;
            await this.authService.validateActivationToken(token);
            return res.status(200).json(sendSuccessfullResponse("Token valid"));
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message));
            }
            return res.status(400).json(sendErrorResponse("Token tidak valid atau expired"));
        }
    }

    async activateAccount(req: Request, res: Response) {
        try {
            const validateQuery = TokenQuerySchema.safeParse(req.query);
            if (!validateQuery.success) {
                const formattedErr = validateQuery.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr));
            }
            const token = validateQuery.data.token;

            if (!req.body) {
                return res.status(400).json(sendErrorResponse("Request body empty"))
            };

            const validate = ActivateAccountSchema.safeParse(req.body);
            if (!validate.success) {
                const formattedErr = validate.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr));
            }

            await this.authService.activateAccount(token, validate.data.password);
            return res.status(200).json(sendSuccessfullResponse("Akun berhasil diaktivasi, silahkan login"));
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message));
            }
            return res.status(400).json(sendErrorResponse("Aktivasi gagal"));
        }
    }

    async logout(req: Request, res: Response) {
        try {
            const authHeader = req.headers['authorization'];
            const token = authHeader?.split(' ')[1];
            if (!token) {
                return res.status(400).json(sendErrorResponse("Token tidak ditemukan"));
            }

            await this.authService.logout(token);

            return res.status(200).json(sendSuccessfullResponse("Logout berhasil"));
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message));
            }
            return res.status(500).json(sendErrorResponse("Logout gagal"));
        }
    }
}
