import type { GetProfileReq, ProfileRes } from "../dto/profile.js";

export interface IProfileService {
    getProfile(
        userId: string,
        limit: number,
        req: GetProfileReq
    ): Promise<ProfileRes>;
}
