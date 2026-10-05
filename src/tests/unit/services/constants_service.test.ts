import { describe, expect, it } from "vitest";
import { ConstantsService } from "../../../services/constants_service";
import {
    HARI,
    CHECKLIST_STATUS,
    TUGAS_STATUS,
    LAPORAN_STATUS,
    LAPORAN_PRIORITY,
    KOLABORASI_STATUS,
    USER_ROLE,
    REF_TIPE,
} from "../../../utils/constants";

const constantsService = new ConstantsService();

describe('ConstantsService.getConstants', () => {
    it('mengembalikan seluruh konstanta aplikasi', async () => {
        const data = constantsService.getConstants();

        expect(data).toEqual({
            hari: [...HARI],
            checklist_status: Object.values(CHECKLIST_STATUS),
            tugas_status: Object.values(TUGAS_STATUS),
            laporan_status: Object.values(LAPORAN_STATUS),
            laporan_priority: Object.values(LAPORAN_PRIORITY),
            kolaborasi_status: Object.values(KOLABORASI_STATUS),
            user_role: Object.values(USER_ROLE),
            ref_tipe: Object.values(REF_TIPE),
        });
    });

    it('mengembalikan hari senin sampai minggu', async () => {
        const data = constantsService.getConstants();

        expect(data.hari).toEqual(['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu']);
    });

    it('mengembalikan user_role yang tersedia', async () => {
        const data = constantsService.getConstants();

        expect(data.user_role).toEqual(expect.arrayContaining(['ob', 'hr', 'admin', 'karyawan']));
    });
});
