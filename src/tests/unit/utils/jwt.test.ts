import { describe, expect, it, vi } from 'vitest';
import { generateJWTToken } from '../../../utils/jwt.js';
import jwt from 'jsonwebtoken';

describe('generateJWTToken', () => {
    it('membuat jwt token dari payload yang dikirim', async () => {
        process.env.JWT_TOKEN = 'test-secret';
        const payload = { id: 'e2fbdc6f-ec0d-4547-a51d-a81b69741ed2', username: 'farhan', role: 'ob' };

        const token = await generateJWTToken(payload);

        const decoded = jwt.verify(token, 'test-secret') as typeof payload & { iat: number; exp: number };
        expect(decoded.id).toBe(payload.id);
        expect(decoded.username).toBe(payload.username);
        expect(decoded.role).toBe(payload.role);
    });

    it('memakai secret dari env JWT_TOKEN', async () => {
        process.env.JWT_TOKEN = 'rahasia-lain';
        const signSpy = vi.spyOn(jwt, 'sign');

        await generateJWTToken({ id: 'user-1' });

        expect(signSpy).toHaveBeenCalledWith(
            { id: 'user-1' },
            'rahasia-lain',
            { expiresIn: '4h' }
        );
    });
});
