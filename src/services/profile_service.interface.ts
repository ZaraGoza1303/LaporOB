import type { ProfileRes, ProfileLaporanQuery } from "../dto/users.js";

export interface IProfileService {
  getProfile(userId: string, role: string, query: ProfileLaporanQuery): Promise<ProfileRes>;
}
