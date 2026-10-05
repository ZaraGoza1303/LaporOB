import { describe, expect, it, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { setBaseUrlMiddleware } from "../../../middleware/setBaseUrl";
import * as urlUtils from "../../../utils/url";

describe('setBaseUrlMiddleware', () => {
    it('menyetel base url dari host dan memanggil next', async () => {
        vi.spyOn(urlUtils, 'isBaseUrlSet').mockReturnValue(false);
        const setSpy = vi.spyOn(urlUtils, 'setBaseUrl').mockImplementation(() => {});
        const next = vi.fn() as unknown as NextFunction;

        const req = {
            protocol: 'http',
            headers: { host: 'localhost:8000' },
        } as unknown as Request;

        setBaseUrlMiddleware(req, {} as Response, next);

        expect(setSpy).toHaveBeenCalledWith('http://localhost:8000');
        expect(next).toHaveBeenCalledTimes(1);
    });

    it('tidak menyetel ulang jika base url sudah ada', async () => {
        vi.spyOn(urlUtils, 'isBaseUrlSet').mockReturnValue(true);
        const setSpy = vi.spyOn(urlUtils, 'setBaseUrl').mockImplementation(() => {});
        const next = vi.fn() as unknown as NextFunction;

        const req = {
            protocol: 'http',
            headers: { host: 'localhost:8000' },
        } as unknown as Request;

        setBaseUrlMiddleware(req, {} as Response, next);

        expect(setSpy).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalledTimes(1);
    });
});
