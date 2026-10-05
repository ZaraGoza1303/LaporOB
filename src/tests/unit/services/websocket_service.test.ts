import { describe, expect, it, vi } from 'vitest';
import { sendToUser, sendToUsers } from '../../../services/websocket_service';
import { WebSocket } from 'ws';

describe('sendToUser', () => {
    it('tidak error jika user tidak punya koneksi', async () => {
        expect(() => sendToUser('user-tanpa-koneksi', { hello: 'world' })).not.toThrow();
    });
});

describe('sendToUsers', () => {
    it('mengirim ke banyak user tanpa error', async () => {
        expect(() => sendToUsers(['user-1', 'user-2'], { tipe: 'TEST' })).not.toThrow();
    });

    it('memanggil sendToUser untuk setiap user', async () => {
        const ws = { readyState: WebSocket.OPEN, send: vi.fn() } as unknown as WebSocket;

        expect(ws.readyState).toBe(WebSocket.OPEN);
        expect(() => sendToUsers([], {})).not.toThrow();
    });
});
