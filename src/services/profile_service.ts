import type { IProfileService } from "./profile_service.interface.js";
import type { IUsersService } from "./users_service.interface.js";
import type { IKaryawanService } from "./karyawan_service.interface.js";
import type { IObService } from "./ob_service.interface.js";
import type { ProfileLaporanQuery, ProfileRes, ObProfileResponse, UserProfileResponse, MappedProfileReport } from "../dto/users.js";
import type { PaginatedResponse } from "../dto/response.js";
import { USER_ROLE } from "../utils/constants.js";

export class ProfileService implements IProfileService {
  constructor(
    private usersService: IUsersService,
    private karyawanService: IKaryawanService,
    private obService: IObService,
  ) {}

  async getProfile(userId: string, role: string, query: ProfileLaporanQuery): Promise<ProfileRes> {
    const isOb = role.toLowerCase() === USER_ROLE.OB;
    const { search, status, cursor, limit } = query;

    const userProfile = isOb
      ? await this.obService.getProfile(userId)
      : await this.usersService.getProfile(userId);

    const laporan = isOb
      ? await this.obService.getRiwayat(userId, limit, { cursor, search, status })
      : await this.karyawanService.getRiwayat(userId, limit, { cursor, search, status });

    const profileRes = this.toProfileRes(userProfile as ObProfileResponse | UserProfileResponse, isOb, laporan as PaginatedResponse<MappedProfileReport>);
    return profileRes;
  }

  private toProfileRes(
    userProfile: ObProfileResponse | UserProfileResponse,
    isOb: boolean,
    laporan: PaginatedResponse<MappedProfileReport>
  ): ProfileRes {
    const base = {
      id: userProfile.id,
      nama_lengkap: userProfile.nama_lengkap,
      username: userProfile.username,
      email: userProfile.email,
      role: userProfile.role,
      profile_picture: userProfile.profile_picture,
    };

    const user = isOb
      ? {
          ...base,
          tasksCompleted: (userProfile as ObProfileResponse).laporanSelesai,
          rejected: (userProfile as ObProfileResponse).laporanDiterima - (userProfile as ObProfileResponse).laporanSelesai,
          lokasi_aktif: (userProfile as ObProfileResponse).lokasiAktif || [],
        }
      : {
          ...base,
          total_laporan: (userProfile as UserProfileResponse).total_laporan,
        };

    const result: ProfileRes = { user, laporan };
    return result;
  }
}
