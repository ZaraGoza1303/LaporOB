import jwt from "jsonwebtoken";

export interface TestUserPayload {
    id: string;
    username: string;
    role: "ADMIN" | "OB" | "KARYAWAN" | "HR";
}

export function generateTestJWT(payload?: Partial<TestUserPayload>): string {
    const defaultPayload: TestUserPayload = {
        id: "test-user-id-123",
        username: "testuser",
        role: "ADMIN",
        ...payload,
    };

    const secret = process.env.JWT_TOKEN || "test-secret";
    return jwt.sign(defaultPayload, secret, { expiresIn: "1h" });
}

export function authHeader(token?: string, payload?: Partial<TestUserPayload>): { Authorization: string } {
    const jwtToken = token ?? generateTestJWT(payload);
    return { Authorization: `Bearer ${jwtToken}` };
}
