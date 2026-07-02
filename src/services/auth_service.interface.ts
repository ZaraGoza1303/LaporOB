import type { LoginReq, LoginRes } from "../dto/auth.js";
import type { UserToken } from "../generated/prisma/client.js";

export interface IAuthService {
    login(req: LoginReq): Promise<LoginRes>;
    loginActivation(req: LoginReq, token: string): Promise<void>;
    validateActivationToken(token: string): Promise<UserToken>;
}