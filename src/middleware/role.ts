import type { NextFunction, Request, Response } from 'express';
import { sendErrorResponse } from '../utils/response.js';

export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role as string
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json(sendErrorResponse("Forbidden"));
    }
    next();
  };
}

