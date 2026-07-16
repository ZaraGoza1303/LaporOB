export interface IRedisClient {
    get(key: string): Promise<string | null>;
    set(key: string, value: string | number | boolean, options?: { EX?: number }): Promise<"OK" | null>;
    setEx(key: string, seconds: number, value: string | number | boolean): Promise<string>;
    del(key: string): Promise<number>;

    hGet(key: string, field: string): Promise<string | undefined>;
    hSet(key: string, field: string, value: unknown): Promise<number>;
    hGetAll(key: string): Promise<Record<string, string>>;
    hDel(key: string, field: string | string[]): Promise<number>;

    sAdd(key: string, member: string | string[]): Promise<number>;
    sMembers(key: string): Promise<string[]>;
    sRem(key: string, member: string | string[]): Promise<number>;

    exists(key: string): Promise<number>;
    ttl(key: string): Promise<number>;

    sendCommand(args: string[]): Promise<unknown>;
}
