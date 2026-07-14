export interface IKaryawanRepository {
    getKaryawanPerformanceStats(userId: string): Promise<number>;
}