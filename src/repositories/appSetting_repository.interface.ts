export interface IAppSettingRepository {
  getAll(): Promise<Array<{ key: string; value: string | null }>>;
  upsert(key: string, value: string | null): Promise<void>;
}
