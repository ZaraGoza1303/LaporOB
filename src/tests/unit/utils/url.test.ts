import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    setBaseUrl,
    isBaseUrlSet,
    buildActivationUrl,
    buildResetPasswordUrl,
    resolveFileUrl,
} from '../../../utils/url.js';

beforeEach(() => {
    vi.unstubAllEnvs();
});

describe('setBaseUrl dan isBaseUrlSet', () => {
    it('mengembalikan true setelah base url diset', async () => {
        setBaseUrl('http://backend:8000');

        expect(isBaseUrlSet()).toBe(true);
    });
});

describe('buildActivationUrl', () => {
    it('membuat url aktivasi dengan token', async () => {
        vi.stubEnv('FRONTEND_BASE_URL', 'http://frontend:5173');

        expect(buildActivationUrl('plain-token')).toBe('http://frontend:5173/activate-account?token=plain-token');
    });

    it('memakai localhost default jika env tidak diset', async () => {
        vi.stubEnv('FRONTEND_BASE_URL', '');

        expect(buildActivationUrl('plain-token')).toContain('/activate-account?token=plain-token');
    });
});

describe('buildResetPasswordUrl', () => {
    it('membuat url reset password dengan token', async () => {
        vi.stubEnv('FRONTEND_BASE_URL', 'http://frontend:5173');

        expect(buildResetPasswordUrl('plain-token')).toBe('http://frontend:5173/reset-password?token=plain-token');
    });
});

describe('resolveFileUrl', () => {
    it('mengembalikan null jika path kosong', async () => {
        expect(resolveFileUrl(null)).toBeNull();
        expect(resolveFileUrl(undefined)).toBeNull();
        expect(resolveFileUrl('')).toBeNull();
    });

    it('mengembalikan url apa adanya jika sudah http', async () => {
        expect(resolveFileUrl('https://cdn.com/foto.png')).toBe('https://cdn.com/foto.png');
        expect(resolveFileUrl('http://cdn.com/foto.png')).toBe('http://cdn.com/foto.png');
    });

    it('menggabungkan base url dengan path lokal', async () => {
        setBaseUrl('http://backend:8000');

        expect(resolveFileUrl('uploads/avatars/farhan.png')).toBe('http://backend:8000/uploads/avatars/farhan.png');
        expect(resolveFileUrl('/uploads/avatars/farhan.png')).toBe('http://backend:8000/uploads/avatars/farhan.png');
    });
});
