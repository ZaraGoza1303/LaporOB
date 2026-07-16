import type { LoginReq, LoginRes } from "../dto/auth.js";
import type { IAuthRepository } from "../repositories/auth_repository.interface.js";
import { generateJWTToken } from "../utils/jwt.js";
import bcrypt from 'bcrypt';
import type { IAuthService } from "./auth_service.interface.js";
import { hashToken } from "../utils/token.js";
import { AppError, handlePrismaError } from "../utils/error.js";
import type { UserToken } from "../generated/prisma/client.js";
import type { IUsersService } from "./users_service.interface.js";
import type { IUserSessionService } from "./userSession_service.interface.js";

export class AuthService implements IAuthService {
    private authRepo: IAuthRepository;
    private usersService: IUsersService;
    private sessionService: IUserSessionService;

    constructor(authRepo: IAuthRepository, usersService: IUsersService, sessionService: IUserSessionService) {
        this.authRepo = authRepo;
        this.usersService = usersService;
        this.sessionService = sessionService;
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
}