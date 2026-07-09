import type { LoginReq, LoginUserData } from "../dto/auth.js";
import { PrismaClient, type UserToken } from "../generated/prisma/client.js";
import type { IAuthRepository } from "./auth_repository.interface.js";

export class AuthRepository implements IAuthRepository {
    private db: PrismaClient;

    constructor(db: PrismaClient) {
        this.db = db;
    }

    async checkUserToken(tokenHash: string): Promise<UserToken | null> {
        const record = await this.db.userToken.findUnique({
            where: {
                token_hash: tokenHash
            }
        })

        return record;
    }

    async login(req: LoginReq): Promise<LoginUserData | null> {
        const isEmail = req.identifier.includes('@');

        const existsUser = await this.db.user.findFirst({
            where: isEmail
                ? { email: req.identifier }
                : { username: req.identifier },
            select: {
                id: true,
                username: true,
                nama_lengkap: true,
                password: true,
                is_active: true,
                role: true,
            }
        });

        return existsUser;
    }

    
}