import request from "supertest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { app } from "../../index.js";
import { container } from "../../container.js";
import { authHeader, generateTestJWT } from "./helpers/testAuth.js";
import { USER_ROLE } from "../../utils/constants.js";

describe("Profile Integration Tests (/api/user)", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        // Mock valid session by default
        vi.spyOn(container.sessionService, "validateSession").mockResolvedValue(true);
    });

    describe("GET /api/user/profile", () => {
        it("harus menolak request tanpa token otentikasi (401)", async () => {
            const res = await request(app).get("/api/user/profile");

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });

        it("harus mengembalikan profile user yang sedang login (200)", async () => {
            const token = generateTestJWT({
                id: "user-admin-1",
                username: "admin1",
                role: USER_ROLE.ADMIN as "ADMIN",
            });

            vi.spyOn(container.profileService, "getProfile").mockResolvedValue({
                id: "user-admin-1",
                username: "admin1",
                email: "admin1@example.com",
                nama_lengkap: "Admin Utama",
                role: USER_ROLE.ADMIN,
                profile_picture: null,
                laporan: [],
            } as never);

            const res = await request(app)
                .get("/api/user/profile")
                .set(authHeader(token));

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.username).toBe("admin1");
            expect(res.body.data.nama_lengkap).toBe("Admin Utama");
        });
    });
});
