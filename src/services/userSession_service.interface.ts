export interface IUserSessionService {
    createSession(
        userId: string,
        token: string,
        deviceInfo?: string | null,
        ipAddress?: string | null
    ): Promise<void>;

    validateSession(token: string): Promise<boolean>;

    revokeSession(token: string): Promise<void>;

    revokeAllUserSessions(userId: string): Promise<void>;
}
