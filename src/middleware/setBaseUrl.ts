import type { Request, Response, NextFunction } from "express";
import { setBaseUrl, isBaseUrlSet } from "../utils/url.js";

export function setBaseUrlMiddleware(req: Request, _res: Response, next: NextFunction) {
    if (!isBaseUrlSet()) {
        const proto = req.headers["x-forwarded-proto"] || req.protocol;
        const host = req.headers["x-forwarded-host"] || req.headers.host;
        setBaseUrl(`${proto}://${host}`);
    }
    next();
}
