import type { PrismaClient, User } from "../generated/prisma/client.js";
import type { IUsersRepository, ProfileUser } from "./users_repository.interface.js";

export class UsersRepository implements IUsersRepository {
    private db: PrismaClient;

    constructor(db: PrismaClient) {
        this.db = db
    }

    async getByID(userId: string): Promise<User | null> {
        return this.db.user.findFirst({
            where: { id: userId }
        })
    }

    async markTokenAsUsed(tokenId: string): Promise<void> {
        await this.db.userToken.update({
            where: { id: tokenId },
            data: { used_at: new Date() }
        })
    }

    async getUserWithRoleById(userId: string): Promise<ProfileUser | null> {
        return this.db.user.findFirst({
            where: {
                id: userId,
                is_deleted: false
            },
            include: { role: true }
        });
    }
}
