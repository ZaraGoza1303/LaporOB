import type { LoginReq, ChangePasswordReq } from "../dto/auth.js";
import type { LoginRes } from "../types/auth.js";
import type { IAuthRepository } from "../repositories/auth_repository.interface.js";
import { generateJWTToken } from "../utils/jwt.js";
import bcrypt from 'bcrypt';
import type { IAuthService } from "./auth_service.interface.js";
import { hashToken, generateActivationToken } from "../utils/token.js";
import { AppError, handlePrismaError } from "../utils/error.js";
import type { UserToken } from "../generated/prisma/client.js";
import type { IUsersService } from "./users_service.interface.js";
import type { IUserSessionService } from "./userSession_service.interface.js";
import type { IEmailService } from "./email_service.interface.js";
import type { IAppSettingService } from "./appSetting_service.interface.js";
import { sendRenderedEmail, toEmailSettings } from "../utils/email.js";
import { buildResetPasswordUrl } from "../utils/url.js";

export class AuthService implements IAuthService {
    private authRepo: IAuthRepository;
    private usersService: IUsersService;
    private sessionService: IUserSessionService;
    private emailService: IEmailService;
    private settingService: IAppSettingService;

    constructor(
        authRepo: IAuthRepository, 
        usersService: IUsersService, 
        sessionService: IUserSessionService,
        emailService: IEmailService,
        settingService: IAppSettingService,
    ) {
        this.authRepo = authRepo;
        this.usersService = usersService;
        this.sessionService = sessionService;
        this.emailService = emailService;
        this.settingService = settingService;
    }

    async login(req: LoginReq, deviceInfo?: string | null, ipAddress?: string | null): Promise<LoginRes> {
        try {
            const existsUser = await this.authRepo.login(req);

            if (!existsUser) {
                throw new AppError("Email/Username atau password salah!", 401)
            }

            if (!existsUser.password) {
                throw new AppError("Akun belum diaktivasi, silahkan aktivasi terlebih dahulu", 403)
            }

            const isMatched = await bcrypt.compare(req.password, existsUser.password!);
            if (!isMatched) {
                throw new AppError("Email/Username atau password salah!", 401)
            }

            if (!existsUser.is_active) {
                throw new AppError("Akun sudah tidak aktif, silahkan hubungi admin", 403)
            }

            const jwtToken = await generateJWTToken({ id: existsUser?.id, username: existsUser.username, role: existsUser.role.nama_role });

            await this.sessionService.createSession(
                existsUser.id,
                jwtToken,
                deviceInfo,
                ipAddress
            );

            const res: LoginRes = {
                jwt_token: jwtToken
            }

            return res
        } catch (err) {
            handlePrismaError(err)
        }
    }

    async validateActivationToken(token: string): Promise<UserToken> {
        try {
            const tokenHash = hashToken(token);
            const record = await this.authRepo.checkUserToken(tokenHash);

            if (!record) throw new AppError("Token tidak valid", 401);
            if (record.used_at) throw new AppError("Token sudah pernah dipakai", 401);
            if (record.expired_at < new Date()) throw new AppError("Token sudah expired", 401);

            return record;
        } catch (err) {
            handlePrismaError(err)
        }
    }

    async activateAccount(token: string, password: string): Promise<void> {
        try {
            const record = await this.validateActivationToken(token);

            await this.usersService.completeActivation(record.user_id, password, record.id);
        } catch (err) {
            handlePrismaError(err)
        }
    }

    async logout(token: string): Promise<void> {
        await this.sessionService.revokeSession(token);
    }

    async forgotPassword(email: string): Promise<void> {
        try {
            const user = await this.usersService.getByEmail(email);
            if (!user) {
                throw new AppError("Email tidak terdaftar", 404);
            }

            const resetToken = generateActivationToken(1); 
            await this.usersService.createPasswordResetToken(user.id, resetToken.tokenHash, resetToken.expiredAt);

            const resetUrl = buildResetPasswordUrl(resetToken.token);
            const settings = await this.settingService.getAll();
            const subjectReset = `Reset Password Akun ${settings.app_name || "Aplikasi"}`;
            await sendRenderedEmail(this.emailService, user.email, subjectReset, "reset-password", {
                userName: user.username,
                resetUrl: resetUrl,
                expiresInHours: 1,
            }, async () => toEmailSettings(settings));
        } catch (err) {
            handlePrismaError(err);
        }
    }

    async resetPassword(token: string, password: string): Promise<void> {
        try {
            const tokenHash = hashToken(token);
            const record = await this.authRepo.checkUserToken(tokenHash);

            if (!record || record.type !== "reset_password") {
                throw new AppError("Token tidak valid", 401);
            }
            if (record.used_at) {
                throw new AppError("Token sudah pernah digunakan", 401);
            }
            if (record.expired_at < new Date()) {
                throw new AppError("Token sudah expired", 401);
            }

            const hashedPassword = await bcrypt.hash(password, 16);
            await this.usersService.resetUserPassword(record.user_id, hashedPassword, record.id);
        } catch (err) {
            handlePrismaError(err);
        }
    }

    async changePassword(userId: string, req: ChangePasswordReq): Promise<void> {
        try {
            const user = await this.usersService.getUserWithPasswordById(userId);
            if (!user) {
                throw new AppError("User tidak ditemukan", 404);
            }

            if (!user.password) {
                throw new AppError("Akun belum diaktivasi", 400);
            }

            const isMatched = await bcrypt.compare(req.oldPassword, user.password);
            if (!isMatched) {
                throw new AppError("Password lama salah", 400);
            }

            const hashedPassword = await bcrypt.hash(req.newPassword, 16);
            await this.usersService.resetUserPassword(userId, hashedPassword, null);

            const settingsPw = await this.settingService.getAll();
            const subjectPw = `Password Akun ${settingsPw.app_name || "Aplikasi"} Berhasil Diubah`;
            await sendRenderedEmail(this.emailService, user.email, subjectPw, "password-changed", {
                userName: user.username,
            }, async () => toEmailSettings(settingsPw));
        } catch (err) {
            handlePrismaError(err);
        }
    }
}