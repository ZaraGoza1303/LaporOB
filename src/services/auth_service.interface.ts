import type { LoginReq, LoginRes, ChangePasswordReq } from "../dto/auth.js";
import type { UserToken } from "../generated/prisma/client.js";

export interface IAuthService {
    login(req: LoginReq, deviceInfo?: string | null, ipAddress?: string | null): Promise<LoginRes>;
    validateActivationToken(token: string): Promise<UserToken>;
    activateAccount(token: string, password: string): Promise<void>;
    logout(token: string): Promise<void>;
    forgotPassword(email: string): Promise<void>;
    resetPassword(token: string, password: string): Promise<void>;
    changePassword(userId: string, req: ChangePasswordReq): Promise<void>;
}