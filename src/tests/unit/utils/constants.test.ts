import { describe, expect, it, vi } from 'vitest';
import {
    CHECKLIST_STATUS,
    TUGAS_STATUS,
    LAPORAN_STATUS,
    LAPORAN_PRIORITY,
    KOLABORASI_STATUS,
    USER_ROLE,
    REF_TIPE,
    HARI,
} from '../../../utils/constants.js';

describe('constants', () => {
    it('memiliki status checklist yang benar', async () => {
        expect(CHECKLIST_STATUS.SELESAI).toBe('SELESAI');
        expect(Object.values(CHECKLIST_STATUS)).toContain('BELUM_DIKERJAKAN');
    });

    it('memiliki status tugas yang benar', async () => {
        expect(TUGAS_STATUS.SELESAI).toBe('SELESAI');
        expect(Object.values(TUGAS_STATUS)).toHaveLength(4);
    });

    it('memiliki status dan prioritas laporan yang benar', async () => {
        expect(LAPORAN_STATUS.PENDING).toBe('PENDING');
        expect(LAPORAN_PRIORITY.URGENT).toBe('URGENT');
        expect(LAPORAN_PRIORITY.STANDARD).toBe('STANDARD');
    });

    it('memiliki status kolaborasi yang benar', async () => {
        expect(KOLABORASI_STATUS.PENDING).toBe('PENDING');
        expect(KOLABORASI_STATUS.APPROVED).toBe('APPROVED');
        expect(KOLABORASI_STATUS.REJECTED).toBe('REJECTED');
    });

    it('memiliki user role yang benar', async () => {
        expect(USER_ROLE.OB).toBe('ob');
        expect(USER_ROLE.ADMIN).toBe('admin');
    });

    it('memiliki ref tipe dan hari yang benar', async () => {
        expect(REF_TIPE.LAPORAN).toBe('LAPORAN');
        expect(HARI).toContain('senin');
        expect(HARI).toHaveLength(7);
    });
});
