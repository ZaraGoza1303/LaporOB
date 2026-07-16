import type { GeneratedToken } from "../dto/token.js";
import crypto from "node:crypto";

export function generateActivationToken(expiresInHours: number): GeneratedToken {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const expiredAt = new Date();
  expiredAt.setHours(expiredAt.getHours() + expiresInHours);

  return { token, tokenHash, expiredAt };
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function generateSessionId(): string {
  return crypto.randomUUID();
}
