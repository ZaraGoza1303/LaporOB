import type { ProfileRes } from "../dto/profile.js";

export interface IProfileService {
    getProfile(userId: string, limit: number, cursor?: string | null, search?: string | null, status?: string | null): Promise<ProfileRes>;
}
