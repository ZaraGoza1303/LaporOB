import type { Request, Response, NextFunction } from "express"
import { sendErrorResponse } from "../utils/response.js";
import jwt from 'jsonwebtoken'
import { AppError } from "../utils/error.js";
import { container } from "../container.js";

export const verifyJWTToken = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];
    if(!token) return res.status(401).json(sendErrorResponse("Unauthorized"));

    const secret = process.env.JWT_TOKEN;
    if (!secret) throw new AppError("JWT_APP env is not defined", 500);

    try {
        const decoded = jwt.verify(token, secret) as {id: string, username: string, role: string}
        req.user = decoded;

        const isValid = await container.sessionService.validateSession(token);

        if (!isValid) {
            return res.status(401).json(sendErrorResponse("Session telah berakhir, silahkan login ulang"));
        }

        next();
    } catch (err: unknown) {
        if (err instanceof jwt.JsonWebTokenError || err instanceof jwt.TokenExpiredError) {
            return res.status(401).json(sendErrorResponse("Token tidak valid atau expired"));
        }
        return res.status(500).json(sendErrorResponse("Internal server error"));
    }
}
