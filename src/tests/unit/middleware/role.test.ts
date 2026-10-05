import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { requireRole } from "../../../middleware/role";

// Fake req/res express.
function createFakeReq(user?: { id: string; username: string; role: string }) {
    return { user } as unknown as Request;
}

function createFakeRes() {
    return {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
    } as unknown as Response;
}

describe('requireRole', () => {
    it('melanjutkan ke next jika role diizinkan', async () => {
        const middleware = requireRole('admin', 'hr');
        const next = vi.fn() as unknown as NextFunction;
        const res = createFakeRes();

        middleware(createFakeReq({ id: '1', username: 'admin', role: 'admin' }), res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
    });

    it('mengembalikan 403 jika role tidak diizinkan', async () => {
        const middleware = requireRole('admin');
        const next = vi.fn() as unknown as NextFunction;
        const res = createFakeRes();

        middleware(createFakeReq({ id: '1', username: 'farhan', role: 'ob' }), res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ success: false, message: expect.any(String) })
        );
    });

    it('mengembalikan 403 jika user tidak ada', async () => {
        const middleware = requireRole('admin');
        const next = vi.fn() as unknown as NextFunction;
        const res = createFakeRes();

        middleware(createFakeReq(undefined), res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
    });
});
