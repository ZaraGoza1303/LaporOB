import type { LoginReq, LoginRes } from "../dto/auth.js";

export interface IAauthService {
    login(req: LoginReq): Promise<LoginRes>;
}