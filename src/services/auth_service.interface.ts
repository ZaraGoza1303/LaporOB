import type { LoginReq, LoginRes } from "../dto/auth.js";

export interface IAuthService {
    login(req: LoginReq): Promise<LoginRes>;
}