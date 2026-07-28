import type { IProfileService } from "./profile_service.interface.js";
import type { IUsersService } from "./users_service.interface.js";
import type { IKaryawanService } from "./karyawan_service.interface.js";
import type { IObService } from "./ob_service.interface.js";
import type { ILaporanService } from "./laporan_service.interface.js";
import type { IAdminService } from "./admin_service.interface.js";
import type { ITugasService } from "./tugas_service.interface.js";
import type { ProfileLaporanQuery, ProfileRes, ObProfileResponse, UserProfileResponse, MappedProfileReport } from "../dto/users.js";
import type { TugasDetailRes } from "../dto/tugas.js";
import type { PaginatedResponse } from "../dto/response.js";
import { USER_ROLE, LAPORAN_STATUS } from "../utils/constants.js";

export class ProfileService implements IProfileService {
  constructor(
    private usersService: IUsersService,
    private karyawanService: IKaryawanService,
    private obService: IObService,
    private laporanService: ILaporanService,
    private adminService: IAdminService,
    private tugasService: ITugasService,
  ) {}

  async getProfile(userId: string, role: string, query: ProfileLaporanQuery): Promise<ProfileRes> {
    const isAdmin = role.toLowerCase() === USER_ROLE.ADMIN;
    const isOb = role.toLowerCase() === USER_ROLE.OB;

    if (isAdmin) {
      const userProfile = await this.usersService.getProfile(userId);
      const adminData = await this.adminService.getAdminStats(userId);
      return {
        user: { ...userProfile, admin: adminData },
      };
    }

    const { search, cursor, limit } = query;

    const userProfile = isOb
      ? await this.obService.getProfile(userId)
      : await this.usersService.getProfile(userId);

    if (!isOb) {
      const totalLaporan = await this.laporanService.getLaporanCountByUserId(userId);
      (userProfile as UserProfileResponse).total_laporan = totalLaporan;
    }

    const laporan: PaginatedResponse<MappedProfileReport> = isOb
      ? await this.laporanService.getRiwayat(userId, limit, cursor, search, LAPORAN_STATUS.SELESAI)
      : await this.karyawanService.getRiwayat(userId, limit, { cursor, search, status: LAPORAN_STATUS.SELESAI }) as PaginatedResponse<MappedProfileReport>;

    let completedTugasCount = 0;
    let tugas: PaginatedResponse<TugasDetailRes> | undefined = undefined;
    if (isOb) {
      const [tugasResult, countResult] = await Promise.all([
        this.tugasService.getCompletedTugasForOb(userId, limit, cursor, search),
        this.tugasService.countCompletedTugasForOb(userId),
      ]);
      tugas = tugasResult;
      completedTugasCount = countResult;
    }

    const profileRes = this.toProfileRes(userProfile as ObProfileResponse | UserProfileResponse, isOb, laporan, completedTugasCount, tugas);
    return profileRes;
  }

  private toProfileRes(
    userProfile: ObProfileResponse | UserProfileResponse,
    isOb: boolean,
    laporan: PaginatedResponse<MappedProfileReport>,
    completedTugasCount: number,
    tugas?: PaginatedResponse<TugasDetailRes>
  ): ProfileRes {
    const obProfile = userProfile as ObProfileResponse;
    const user: ProfileRes['user'] = {
      id: userProfile.id,
      nama_lengkap: userProfile.nama_lengkap,
      username: userProfile.username,
      email: userProfile.email,
      role: userProfile.role,
      profile_picture: userProfile.profile_picture,
      ...(isOb ? {
        tasksCompleted: completedTugasCount,
        laporanSelesai: obProfile.laporanSelesai ?? 0,
        lokasiAktif: obProfile.lokasiAktif,
      } : {
        total_laporan: (userProfile as UserProfileResponse).total_laporan ?? 0,
      }),
    };
    const profileRes: ProfileRes = {
      user,
      laporan,
      ...(tugas !== undefined && { tugas }),
    };
    return profileRes;
  }
}
