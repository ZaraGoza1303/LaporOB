import type { LoginReq, LoginRes } from "../dto/auth.js";
import type { IAuthRepository } from "../repositories/auth_repository.interface.js";
import { generateJWTToken } from "../utils/jwt.js";
import bcrypt from 'bcrypt';
import type { IAuthService } from "./auth_service.interface.js";
import { hashActivationToken } from "../utils/token.js";
import { AppError, handlePrismaError } from "../utils/error.js";
import type { UserToken } from "../generated/prisma/client.js";
import type { IUsersRepository } from "../repositories/users_repository.interface.js";
import type { UserUpdateInput } from "../generated/prisma/models.js";

export class AuthService implements IAuthService {
    private authRepo: IAuthRepository;
    private usersRepo: IUsersRepository;

    constructor(authRepo: IAuthRepository, usersRepo: IUsersRepository) {
        this.authRepo = authRepo;
        this.usersRepo = usersRepo;
    }

    async login(req: LoginReq): Promise<LoginRes> {
        try {
            const existsUser = await this.authRepo.login(req);

            if (!existsUser) {
                throw new AppError("Email/Username atau password salah!", 401)
            }

            if (!existsUser.password) {
                throw new AppError("Akun belum diaktivasi, silahkan aktivasi terlebih dahulu", 401)
            }

            const isMatched = await bcrypt.compare(req.password, existsUser.password!);
            if (!isMatched) {
                throw new AppError("Email/Username atau password salah!", 401)
            }

            if (!existsUser.is_active) {
                throw new AppError("Akun sudah tidak aktif, silahkan hubungi admin", 401)
            }

            const jwtToken = await generateJWTToken({ id: existsUser?.id, username: existsUser.username, role: existsUser.role.nama_role });
            const res: LoginRes = {
                jwt_token: jwtToken
            }

            return res
        } catch (err) {
            handlePrismaError(err)
        }
    }

    async loginActivation(req: LoginReq, token: string): Promise<void> {
        try {
            const existsUser = await this.authRepo.login(req);

            if (!existsUser) {
                throw new AppError("Email/Username atau password salah!", 401)
            }

            const isMatched = await bcrypt.compare(req.password, existsUser.password!);
            if (!isMatched) {
                throw new AppError("Email/Username atau password salah!", 401)
            }

            const record = await this.validateActivationToken(token);
            await this.usersRepo.markTokenAsUsed(record.id);
            
        } catch (err) {
            handlePrismaError(err)
        }
    }

    async validateActivationToken(token: string): Promise<UserToken> {
        try {
            const tokenHash = hashActivationToken(token);
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

            const hashedPassword = await bcrypt.hash(password, 16);

            await this.usersRepo.update(record.user_id, {
                password: hashedPassword,
                is_active: true,
            } as UserUpdateInput);

            await this.usersRepo.markTokenAsUsed(record.id);
        } catch (err) {
            handlePrismaError(err)
        }
    }
}