import request from "supertest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { app } from "../../index.js";
import { container } from "../../container.js";
import { authHeader, generateTestJWT } from "./helpers/testAuth.js";
import { USER_ROLE } from "../../utils/constants.js";

describe("Admin User Management Integration Tests (/api/admin/users)", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        vi.spyOn(container.sessionService, "validateSession").mockResolvedValue(true);
    });

    it("harus menolak role non-ADMIN mengakses endpoint user management (403)", async () => {
        const hrToken = generateTestJWT({ role: USER_ROLE.HR as "HR" });

        const res = await request(app)
            .get("/api/admin/users")
            .set(authHeader(hrToken));

        expect(res.status).toBe(403);
        expect(res.body.success).toBe(false);
    });

    it("harus mengizinkan ADMIN mengambil daftar user (200)", async () => {
        const adminToken = generateTestJWT({ role: USER_ROLE.ADMIN as "ADMIN" });
        vi.spyOn(container.usersService, "getAll").mockResolvedValue({
            data: [],
            meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
        } as never);

        const res = await request(app)
            .get("/api/admin/users")
            .set(authHeader(adminToken));

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it("harus mengembalikan 400 jika format data pembuatan user salah", async () => {
        const adminToken = generateTestJWT({ role: USER_ROLE.ADMIN as "ADMIN" });

        const res = await request(app)
            .post("/api/admin/user")
            .set(authHeader(adminToken))
            .send({
                email: "bukan-email-valid",
            });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.errors).toBeDefined();
    });
});
