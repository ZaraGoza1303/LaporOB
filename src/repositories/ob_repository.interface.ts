import type { User } from "../generated/prisma/client.js";

export interface IObRepository {
    getObById(obId: string): Promise<User | null>;
    getTodayChecklists(obId: string, tanggal: Date): Promise<any[]>;
    countTodayChecklists(obId: string, tanggal: Date): Promise<number>;
    getReports(obId: string): Promise<any[]>;
}