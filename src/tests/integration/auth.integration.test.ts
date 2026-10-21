import request from "supertest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { app } from "../../index.js";
import { container } from "../../container.js";
import { authHeader, generateTestJWT } from "./helpers/testAuth.js";
import { AppError } from "../../utils/error.js";

describe("Auth Integration Tests (/api/auth)", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    describe("POST /api/auth/login", () => {
        it("harus mengembalikan 400 jika payload login tidak lengkap", async () => {
            const res = await request(app)
                .post("/api/auth/login")
                .send({});

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.errors).toBeDefined();
        });

        it("harus mengembalikan 400 jika identifier kosong", async () => {
            const res = await request(app)
                .post("/api/auth/login")
                .send({ identifier: "", password: "password123" });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it("harus mengembalikan 401 jika kredensial salah (AppError dari service)", async () => {
            vi.spyOn(container.authService, "login").mockRejectedValue(
                new AppError("Username atau password salah", 401)
            );

            const res = await request(app)
                .post("/api/auth/login")
                .send({ identifier: "wronguser", password: "wrongpassword" });

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe("Username atau password salah");
        });

        it("harus mengembalikan 200 dan JWT token jika kredensial benar", async () => {
            vi.spyOn(container.authService, "login").mockResolvedValue({
                jwt_token: "mocked-jwt-token-xyz",
            });

            const res = await request(app)
                .post("/api/auth/login")
                .send({ identifier: "admin", password: "password123" });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toEqual({
                jwt_token: "mocked-jwt-token-xyz",
            });
        });
    });

    describe("GET /api/auth/check-token", () => {
        it("harus mengembalikan 400 jika token query param tidak ada", async () => {
            const res = await request(app).get("/api/auth/check-token");

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it("harus mengembalikan 200 jika token valid", async () => {
            vi.spyOn(container.authService, "validateActivationToken").mockResolvedValue({
                id: "token-id-1",
                user_id: "user-1",
                token: "token-hash",
                expired_at: new Date(Date.now() + 3600000),
                used_at: null,
                created_at: new Date(),
            });

            const res = await request(app)
                .get("/api/auth/check-token")
                .query({ token: "valid-activation-token" });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe("Token valid");
        });
    });

    describe("POST /api/auth/logout", () => {
        it("harus mengembalikan 401 jika tidak menyertakan Authorization header", async () => {
            const res = await request(app).post("/api/auth/logout");

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });

        it("harus mengembalikan 200 jika session valid dan berhasil logout", async () => {
            const token = generateTestJWT();
            vi.spyOn(container.sessionService, "validateSession").mockResolvedValue(true);
            vi.spyOn(container.authService, "logout").mockResolvedValue(undefined);

            const res = await request(app)
                .post("/api/auth/logout")
                .set(authHeader(token));

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });

    describe("POST /api/auth/forgot-password", () => {
        it("harus mengembalikan 400 jika format email salah", async () => {
            const res = await request(app)
                .post("/api/auth/forgot-password")
                .send({ email: "bukan-email" });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it("harus mengembalikan 200 jika email valid", async () => {
            vi.spyOn(container.authService, "forgotPassword").mockResolvedValue(undefined);

            const res = await request(app)
                .post("/api/auth/forgot-password")
                .send({ email: "user@example.com" });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });
});
