import type { Request, Response, NextFunction } from "express"
import { sendErrorResponse } from "../utils/response.js";
import jwt from 'jsonwebtoken'

export const verifyJWTToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];
    if(!token) return res.status(401).json(sendErrorResponse("Unauthorized"));

    const secret = process.env.JWT_TOKEN;
    if (!secret) throw new Error("JWT_APP env is not defined");

    try {
        const decoded = jwt.verify(token, secret) as {id: string, username: string, role: string, password: string}
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json(sendErrorResponse("token not valid"))
    }
}

export const authorizeRole = (allowedRoles: string) => {
    return(req: Request, res: Response, next: NextFunction) => {
        if(!req.user || !allowedRoles.includes(req.user.role)){
            return res.status(403).json(sendErrorResponse("Forbidden"));
        }
        
        next();
    }
}   