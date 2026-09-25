import { afterEach, vi } from 'vitest';

// Jangan sampai test menyentuh service eksternal tanpa disengaja.
process.env.NODE_ENV ??= 'test';
process.env.JWT_TOKEN ??= 'test-secret';
process.env.TZ ??= 'UTC';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});
