import type { LoginReq, LoginUserData } from "../dto/auth.js";
import type { UserToken } from "../generated/prisma/client.js";

export interface IAuthRepository {
    login(req: LoginReq): Promise<LoginUserData | null>;
    checkUserToken(tokenHash: string): Promise<UserToken>;
}