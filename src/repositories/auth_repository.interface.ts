import type { LoginReq, LoginUserData } from "../dto/auth.js";

export interface IAuthRepository {
    login(req: LoginReq): Promise<LoginUserData | null>;
}