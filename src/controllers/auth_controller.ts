import type { Request, Response } from "express";
import { LoginSchema } from "../dto/auth.js";
import { sendErrorResponse, sendSuccessfullResponse } from "../utils/response.js";
import type { IAuthService } from "../services/auth_service.interface.js";

export class AuthController {
    private authService: IAuthService

    constructor(authService: IAuthService) {
        this.authService = authService
    }

    async login(req: Request, res: Response) {
        try {
            if(!req.body){
                return res.status(400).json(sendErrorResponse("Request body empty"))
            };

            const validate = LoginSchema.safeParse(req.body);
            if(!validate.success){
                const formattedErr = validate.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr))
            }

            const response = await this.authService.login(validate.data);
            return res.status(200).json(sendSuccessfullResponse("Login Berhasil", response))
        } catch (err: any) {
            return res.status(400).json(sendErrorResponse("Login Gagal", err.message))
        }
    }
}