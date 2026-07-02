import type { LoginReq, LoginUserData } from "../dto/auth.js";
import { PrismaClient, type UserToken } from "../generated/prisma/client.js";
import type { IAuthRepository } from "./auth_repository.interface.js";

export class AuthRepository implements IAuthRepository {
    private db: PrismaClient;

    constructor(db: PrismaClient) {
        this.db = db;
    }

    async checkUserToken(tokenHash: string): Promise<UserToken> {
        const record = await this.db.userToken.findUnique({
            where: {
                token_hash: tokenHash
            }
        })

        if (!record) {
            throw new Error('Token not found')
        }

        return record
    }

    async login(req: LoginReq): Promise<LoginUserData | null> {
        const existsUser = await this.db.user.findFirst({
            where: {email: req.email},
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