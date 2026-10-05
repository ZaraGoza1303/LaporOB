import { beforeEach, describe, expect, it } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";
import { ProfileService } from "../../../services/profile_service";
import type { IUsersService } from "../../../services/users_service.interface";
import type { IKaryawanService } from "../../../services/karyawan_service.interface";
import type { IObService } from "../../../services/ob_service.interface";
import type { ILaporanService } from "../../../services/laporan_service.interface";
import type { IAdminService } from "../../../services/admin_service.interface";
import type { ITugasService } from "../../../services/tugas_service.interface";

const mockUsersService = mockDeep<IUsersService>();
const mockKaryawanService = mockDeep<IKaryawanService>();
const mockObService = mockDeep<IObService>();
const mockLaporanService = mockDeep<ILaporanService>();
const mockAdminService = mockDeep<IAdminService>();
const mockTugasService = mockDeep<ITugasService>();

const mockProfileService = new ProfileService(
    mockUsersService,
    mockKaryawanService,
    mockObService,
    mockLaporanService,
    mockAdminService,
    mockTugasService
);

beforeEach(() => {
    mockReset(mockUsersService);
    mockReset(mockKaryawanService);
    mockReset(mockObService);
    mockReset(mockLaporanService);
    mockReset(mockAdminService);
    mockReset(mockTugasService);
});

const userId = 'e2fbdc6f-ec0d-4547-a51d-a81b69741ed2';

describe('ProfileService.getProfile', () => {
    it('mengembalikan profil admin beserta statistik', async () => {
        mockUsersService.getProfile.mockResolvedValue({
            id: userId,
            nama_lengkap: 'Admin',
            username: 'admin',
            email: 'admin@gmail.com',
            role: 'admin',
            profile_picture: null,
        } as never);
        mockAdminService.getAdminStats.mockResolvedValue({ total: 10 } as never);

        const data = await mockProfileService.getProfile(userId, 'admin', { limit: 10 } as never);

        expect(mockUsersService.getProfile).toHaveBeenCalledWith(userId);
        expect(mockAdminService.getAdminStats).toHaveBeenCalledWith(userId);
        expect((data.user as Record<string, unknown>).admin).toEqual({ total: 10 });
    });

    it('mengembalikan profil ob beserta laporan dan tugas selesai', async () => {
        mockObService.getProfile.mockResolvedValue({
            id: userId,
            nama_lengkap: 'Farhan OB',
            username: 'farhan_ob',
            email: 'farhan_ob@gmail.com',
            role: 'ob',
            profile_picture: null,
            laporanSelesai: 5,
            lokasiAktif: [],
        } as never);
        mockLaporanService.getRiwayat.mockResolvedValue({
            items: [],
            next_cursor: null,
            meta: { total_items: 0, current_page: 1, limit: 10, total_pages: 0 },
        } as never);
        mockTugasService.getCompletedTugasForOb.mockResolvedValue({
            items: [],
            next_cursor: null,
            meta: { total_items: 0, current_page: 1, limit: 10, total_pages: 0 },
        } as never);
        mockTugasService.countCompletedTugasForOb.mockResolvedValue(7);

        const data = await mockProfileService.getProfile(userId, 'ob', { limit: 10 } as never);

        expect(mockObService.getProfile).toHaveBeenCalledWith(userId);
        expect(mockTugasService.getCompletedTugasForOb).toHaveBeenCalled();
        expect(data.user.tasksCompleted).toBe(7);
    });

    it('mengembalikan profil karyawan beserta total laporan', async () => {
        mockUsersService.getProfile.mockResolvedValue({
            id: userId,
            nama_lengkap: 'Karyawan',
            username: 'karyawan',
            email: 'karyawan@gmail.com',
            role: 'karyawan',
            profile_picture: null,
        } as never);
        mockLaporanService.getLaporanCountByUserId.mockResolvedValue(4);
        mockKaryawanService.getRiwayat.mockResolvedValue({
            items: [],
            next_cursor: null,
            meta: { total_items: 0, current_page: 1, limit: 10, total_pages: 0 },
        } as never);

        const data = await mockProfileService.getProfile(userId, 'karyawan', { limit: 10 } as never);

        expect(mockLaporanService.getLaporanCountByUserId).toHaveBeenCalledWith(userId);
        expect(data.user.total_laporan).toBe(4);
    });
});
