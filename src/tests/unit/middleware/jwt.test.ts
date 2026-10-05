import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";
import jwt from 'jsonwebtoken';
import { verifyJWTToken } from "../../../middleware/jwt";

// Fake req/res express.
function createFakeReq(token?: string) {
    return {
        headers: token ? { authorization: `Bearer ${token}` } : {},
    } as unknown as Request;
}

function createFakeRes() {
    return {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
    } as unknown as Response;
}

vi.mock("../../../container", () => ({
    container: {
        sessionService: { validateSession: vi.fn() },
    },
}));

import { container } from "../../../container";

beforeEach(() => {
    vi.restoreAllMocks();
    process.env.JWT_TOKEN = 'test-secret';
});

describe('verifyJWTToken', () => {
    it('mengembalikan 401 jika token tidak ada', async () => {
        const next = vi.fn() as unknown as NextFunction;
        const res = createFakeRes();

        await verifyJWTToken(createFakeReq(), res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
    });

    it('menyimpan user dan lanjut jika token dan session valid', async () => {
        const token = jwt.sign({ id: 'user-1', username: 'farhan', role: 'ob' }, 'test-secret');
        vi.mocked(container.sessionService.validateSession).mockResolvedValue(true);
        const next = vi.fn() as unknown as NextFunction;
        const req = createFakeReq(token);
        const res = createFakeRes();

        await verifyJWTToken(req, res, next);

        expect(req.user?.id).toBe('user-1');
        expect(next).toHaveBeenCalledTimes(1);
    });

    it('mengembalikan 401 jika session sudah berakhir', async () => {
        const token = jwt.sign({ id: 'user-1', username: 'farhan', role: 'ob' }, 'test-secret');
        vi.mocked(container.sessionService.validateSession).mockResolvedValue(false);
        const next = vi.fn() as unknown as NextFunction;
        const res = createFakeRes();

        await verifyJWTToken(createFakeReq(token), res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
    });

    it('mengembalikan 401 jika token tidak valid', async () => {
        const next = vi.fn() as unknown as NextFunction;
        const res = createFakeRes();

        await verifyJWTToken(createFakeReq('token-salah'), res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
    });
});
