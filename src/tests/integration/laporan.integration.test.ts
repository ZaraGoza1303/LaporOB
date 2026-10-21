import request from "supertest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { app } from "../../index.js";
import { container } from "../../container.js";
import { authHeader, generateTestJWT } from "./helpers/testAuth.js";
import { USER_ROLE } from "../../utils/constants.js";

describe("Laporan & Upload Integration Tests (/api/karyawan/laporan)", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        vi.spyOn(container.sessionService, "validateSession").mockResolvedValue(true);
    });

    const validKategori = "550e8400-e29b-41d4-a716-446655440001";
    const validLantai = "550e8400-e29b-41d4-a716-446655440002";
    const validRuangan = "550e8400-e29b-41d4-a716-446655440003";

    it("harus menolak role OB membuat laporan via endpoint karyawan (403)", async () => {
        const obToken = generateTestJWT({ role: USER_ROLE.OB as "OB" });

        const res = await request(app)
            .post("/api/karyawan/laporan")
            .set(authHeader(obToken));

        expect(res.status).toBe(403);
        expect(res.body.success).toBe(false);
    });

    it("harus mengembalikan 400 jika field foto_masalah tidak diupload", async () => {
        const karyawanToken = generateTestJWT({ role: USER_ROLE.KARYAWAN as "KARYAWAN" });

        const res = await request(app)
            .post("/api/karyawan/laporan")
            .set(authHeader(karyawanToken))
            .field("kategori_id", validKategori)
            .field("prioritas", "STANDARD")
            .field("lantai_id", validLantai)
            .field("ruangan_id", validRuangan)
            .field("deskripsi_kendala", "AC ruangan panas dan bersuara berisik");

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toMatch(/foto masalah wajib diupload/i);
    });

    it("harus mengembalikan 400 jika file yang diunggah bukan gambar", async () => {
        const karyawanToken = generateTestJWT({ role: USER_ROLE.KARYAWAN as "KARYAWAN" });

        const fakeTextFile = Buffer.from("Ini bukan gambar, ini teks");

        const res = await request(app)
            .post("/api/karyawan/laporan")
            .set(authHeader(karyawanToken))
            .field("kategori_id", validKategori)
            .field("prioritas", "STANDARD")
            .field("lantai_id", validLantai)
            .field("ruangan_id", validRuangan)
            .field("deskripsi_kendala", "AC ruangan panas")
            .attach("foto_masalah", fakeTextFile, "catatan.txt");

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });
});
