import type { ProfileLaporanQuery } from "../dto/users.js";
import type { ProfileRes } from "../types/users.js";

export interface IProfileService {
  getProfile(userId: string, role: string, query: ProfileLaporanQuery): Promise<ProfileRes>;
}
