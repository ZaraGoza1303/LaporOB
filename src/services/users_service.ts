import type { IUsersRepository } from "../repositories/users_repository.interface.js";
import { handlePrismaError } from "../utils/error.js";
import { resolveFileUrl } from "../utils/url.js";
import type { IUsersService } from "./users_service.interface.js";

export class UsersService implements IUsersService {
    private usersRepo: IUsersRepository;

    constructor(usersRepo: IUsersRepository) {
        this.usersRepo = usersRepo;
    }

    async getProfile(userId: string): Promise<{
        id: string;
        nama_lengkap: string;
        username: string;
        email: string;
        role: string;
        profile_picture: string | null;
    }> {
        try {
            const user = await this.usersRepo.getUserWithRoleById(userId);
            if (!user) {
                throw new Error("User tidak ditemukan");
            }

            return {
                id: user.id,
                nama_lengkap: user.nama_lengkap,
                username: user.username,
                email: user.email,
                role: user.role.nama_role,
                profile_picture: resolveFileUrl(user.profile_picture)
            };
        } catch (err) {
            handlePrismaError(err);
        }
    }
}
