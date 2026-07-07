import type { User } from "../generated/prisma/client.js";

export type ProfileUser = User & {
    role: {
        nama_role: string;
    };
};

export interface IUsersRepository {
    getByID(userId: string): Promise<User | null>
    markTokenAsUsed(tokenId: string): Promise<void>;
    getUserWithRoleById(userId: string): Promise<ProfileUser | null>;
}
