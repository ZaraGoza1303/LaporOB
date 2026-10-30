import request from "supertest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { app } from "../../index.js";
import { container } from "../../container.js";
import { authHeader, generateTestJWT } from "./helpers/testAuth.js";
import { USER_ROLE } from "../../utils/constants.js";

const READ_ENDPOINTS = [
    "/api/kategori",
    "/api/lantai",
    "/api/lokasi",
    "/api/ruangan",
];

const WRITE_REQUESTS = [
    { method: "post" as const, path: "/api/kategori" },
    { method: "put" as const, path: "/api/kategori/550e8400-e29b-41d4-a716-446655440000" },
    { method: "delete" as const, path: "/api/kategori/550e8400-e29b-41d4-a716-446655440000" },
    { method: "post" as const, path: "/api/lantai" },
    { method: "patch" as const, path: "/api/lantai/550e8400-e29b-41d4-a716-446655440000" },
    { method: "delete" as const, path: "/api/lantai/550e8400-e29b-41d4-a716-446655440000" },
    { method: "post" as const, path: "/api/lokasi" },
    { method: "patch" as const, path: "/api/lokasi/550e8400-e29b-41d4-a716-446655440000" },
    { method: "delete" as const, path: "/api/lokasi/550e8400-e29b-41d4-a716-446655440000" },
    { method: "post" as const, path: "/api/ruangan" },
    { method: "patch" as const, path: "/api/ruangan/550e8400-e29b-41d4-a716-446655440000" },
    { method: "delete" as const, path: "/api/ruangan/550e8400-e29b-41d4-a716-446655440000" },
];

describe("RBAC master data (kategori, lantai, lokasi, ruangan)", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        vi.spyOn(container.sessionService, "validateSession").mockResolvedValue(true);
        vi.spyOn(container.kategoriService, "getAll").mockResolvedValue([] as never);
        vi.spyOn(container.lantaiService, "getAll").mockResolvedValue([] as never);
        vi.spyOn(container.lokasiService, "getAll").mockResolvedValue([] as never);
        vi.spyOn(container.ruanganService, "getAll").mockResolvedValue([] as never);
    });

    it.each([USER_ROLE.KARYAWAN, USER_ROLE.HR])(
        "role %s tetap boleh membaca master data untuk form laporan",
        async (role) => {
            const token = generateTestJWT({ role: role as "KARYAWAN" });

            for (const path of READ_ENDPOINTS) {
                const res = await request(app).get(path).set(authHeader(token));

                expect(res.status, `${role} GET ${path}`).toBe(200);
                expect(res.body.success).toBe(true);
            }
        },
    );

    it.each([USER_ROLE.KARYAWAN, USER_ROLE.HR])(
        "role %s tidak boleh memutasi master data",
        async (role) => {
            const token = generateTestJWT({ role: role as "KARYAWAN" });

            for (const { method, path } of WRITE_REQUESTS) {
                const res = await request(app)[method](path).set(authHeader(token));

                expect(res.status, `${role} ${method.toUpperCase()} ${path}`).toBe(403);
                expect(res.body.success).toBe(false);
            }
        },
    );

    it("role ADMIN tetap boleh memutasi master data", async () => {
        const token = generateTestJWT({ role: USER_ROLE.ADMIN as "ADMIN" });
        vi.spyOn(container.kategoriService, "create").mockResolvedValue({
            id: "kat-new",
            nama_kategori: "Peralatan",
            created_at: new Date(),
            updated_at: new Date(),
        } as never);

        const res = await request(app)
            .post("/api/kategori")
            .set(authHeader(token))
            .send({ nama_kategori: "Peralatan" });

        expect(res.status).toBe(201);
    });
});
