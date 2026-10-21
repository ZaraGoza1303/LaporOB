import request from "supertest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { app } from "../../index.js";
import { container, tugasService } from "../../container.js";
import { authHeader, generateTestJWT } from "./helpers/testAuth.js";
import { USER_ROLE } from "../../utils/constants.js";

describe("Tugas Integration Tests (/api/tugas)", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        vi.spyOn(container.sessionService, "validateSession").mockResolvedValue(true);
    });

    describe("Role Protection", () => {
        it("harus menolak role KARYAWAN mengakses endpoint tugas (403 Forbidden)", async () => {
            const karyawanToken = generateTestJWT({ role: USER_ROLE.KARYAWAN as "KARYAWAN" });

            const res = await request(app)
                .get("/api/tugas")
                .set(authHeader(karyawanToken));

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
        });

        it("harus mengizinkan role ADMIN mengakses endpoint tugas (200 OK)", async () => {
            const adminToken = generateTestJWT({ role: USER_ROLE.ADMIN as "ADMIN" });
            vi.spyOn(tugasService, "getAll").mockResolvedValue([]);

            const res = await request(app)
                .get("/api/tugas")
                .set(authHeader(adminToken));

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toEqual([]);
        });
    });

    describe("POST /api/tugas", () => {
        const validUUID = "550e8400-e29b-41d4-a716-446655440000";

        it("harus mengembalikan 400 jika kategori_id bukan UUID", async () => {
            const adminToken = generateTestJWT({ role: USER_ROLE.ADMIN as "ADMIN" });

            const res = await request(app)
                .post("/api/tugas")
                .set(authHeader(adminToken))
                .send({
                    kategori_id: "bukan-uuid",
                    nama_tugas: "Bersihkan Kaca",
                    tanggal_selesai: "2026-10-30",
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.errors).toBeDefined();
        });

        it("harus mengembalikan 400 jika nama_tugas kosong", async () => {
            const adminToken = generateTestJWT({ role: USER_ROLE.ADMIN as "ADMIN" });

            const res = await request(app)
                .post("/api/tugas")
                .set(authHeader(adminToken))
                .send({
                    kategori_id: validUUID,
                    nama_tugas: "",
                    tanggal_selesai: "2026-10-30",
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it("harus mengembalikan 201 jika payload tugas valid", async () => {
            const adminToken = generateTestJWT({ role: USER_ROLE.ADMIN as "ADMIN" });
            vi.spyOn(tugasService, "create").mockResolvedValue({
                id: validUUID,
                nama_tugas: "Sapu Koridor Lantai 2",
            } as never);

            const res = await request(app)
                .post("/api/tugas")
                .set(authHeader(adminToken))
                .send({
                    kategori_id: validUUID,
                    nama_tugas: "Sapu Koridor Lantai 2",
                    tanggal_selesai: "2026-10-30",
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
        });
    });
});
