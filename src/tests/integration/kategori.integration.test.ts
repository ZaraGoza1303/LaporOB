import request from "supertest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { app } from "../../index.js";
import { container } from "../../container.js";
import { authHeader, generateTestJWT } from "./helpers/testAuth.js";
import { USER_ROLE } from "../../utils/constants.js";

describe("Kategori Integration Tests (/api/kategori)", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        // Default: valid session for verifyJWTToken middleware
        vi.spyOn(container.sessionService, "validateSession").mockResolvedValue(true);
    });

    describe("Authentication & Authorization Guard", () => {
        it("harus menolak request tanpa token (401 Unauthorized)", async () => {
            const res = await request(app).get("/api/kategori");

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe("Unauthorized");
        });

        it("harus menolak role OB untuk mengakses GET /api/kategori (403 Forbidden)", async () => {
            const obToken = generateTestJWT({ role: USER_ROLE.OB as "OB" });

            const res = await request(app)
                .get("/api/kategori")
                .set(authHeader(obToken));

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
        });

        it("harus mengizinkan role ADMIN mengakses GET /api/kategori (200 OK)", async () => {
            const adminToken = generateTestJWT({ role: USER_ROLE.ADMIN as "ADMIN" });
            vi.spyOn(container.kategoriService, "getAll").mockResolvedValue([
                { id: "kat-1", nama_kategori: "Kebersihan", created_at: new Date(), updated_at: new Date() },
            ]);

            const res = await request(app)
                .get("/api/kategori")
                .set(authHeader(adminToken));

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveLength(1);
            expect(res.body.data[0].nama_kategori).toBe("Kebersihan");
        });
    });

    describe("POST /api/kategori", () => {
        it("harus mengembalikan 400 jika nama_kategori kosong", async () => {
            const adminToken = generateTestJWT({ role: USER_ROLE.ADMIN as "ADMIN" });

            const res = await request(app)
                .post("/api/kategori")
                .set(authHeader(adminToken))
                .send({ nama_kategori: "" });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.errors).toBeDefined();
        });

        it("harus mengembalikan 201 jika data kategori valid", async () => {
            const adminToken = generateTestJWT({ role: USER_ROLE.ADMIN as "ADMIN" });
            vi.spyOn(container.kategoriService, "create").mockResolvedValue({
                id: "kat-new-123",
                nama_kategori: "Peralatan",
                created_at: new Date(),
                updated_at: new Date(),
            });

            const res = await request(app)
                .post("/api/kategori")
                .set(authHeader(adminToken))
                .send({ nama_kategori: "Peralatan" });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe("Berhasil menambahkan data kategori");
        });
    });

    describe("GET /api/kategori/:kategori_id", () => {
        it("harus mengembalikan 400 jika format kategori_id bukan UUID", async () => {
            const adminToken = generateTestJWT({ role: USER_ROLE.ADMIN as "ADMIN" });

            const res = await request(app)
                .get("/api/kategori/invalid-uuid-id")
                .set(authHeader(adminToken));

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.errors).toBeDefined();
        });

        it("harus mengembalikan 200 jika format kategori_id valid UUID", async () => {
            const validUUID = "550e8400-e29b-41d4-a716-446655440000";
            const adminToken = generateTestJWT({ role: USER_ROLE.ADMIN as "ADMIN" });
            vi.spyOn(container.kategoriService, "getByID").mockResolvedValue({
                id: validUUID,
                nama_kategori: "Kebersihan Lantai",
                created_at: new Date(),
                updated_at: new Date(),
            });

            const res = await request(app)
                .get(`/api/kategori/${validUUID}`)
                .set(authHeader(adminToken));

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.nama_kategori).toBe("Kebersihan Lantai");
        });
    });
});
