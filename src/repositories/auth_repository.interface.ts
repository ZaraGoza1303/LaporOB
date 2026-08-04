import type { LoginReq } from "../dto/auth.js";
import type { LoginUserData } from "../types/auth.js";
import type { UserToken } from "../generated/prisma/client.js";

export interface IAuthRepository {
    login(req: LoginReq): Promise<LoginUserData | null>;
    checkUserToken(tokenHash: string): Promise<UserToken | null>;
}