import { describe, expect, it } from 'vitest';
import { generateActivationToken, hashToken, generateSessionId } from '../../../utils/token.js';

describe('generateActivationToken', () => {
    it('membuat token, hash, dan expired sesuai jam yang diminta', async () => {
        const before = Date.now();
        const result = generateActivationToken(1);

        expect(result.token).toEqual(expect.any(String));
        expect(result.token).toHaveLength(64);
        expect(result.tokenHash).toBe(hashToken(result.token));
        expect(result.expiredAt.getTime()).toBeGreaterThanOrEqual(before + 3600 * 1000 - 5000);
    });

    it('membuat token unik setiap dipanggil', async () => {
        const first = generateActivationToken(1);
        const second = generateActivationToken(1);

        expect(first.token).not.toBe(second.token);
        expect(first.tokenHash).not.toBe(second.tokenHash);
    });
});

describe('hashToken', () => {
    it('menghasilkan hash sha256 yang konsisten', async () => {
        expect(hashToken('plain-token')).toBe(hashToken('plain-token'));
        expect(hashToken('plain-token')).toHaveLength(64);
    });

    it('menghasilkan hash berbeda untuk token berbeda', async () => {
        expect(hashToken('token-satu')).not.toBe(hashToken('token-dua'));
    });
});

describe('generateSessionId', () => {
    it('membuat session id berupa uuid', async () => {
        const sessionId = generateSessionId();

        expect(sessionId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });
});
