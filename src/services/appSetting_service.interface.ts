export interface AppSettingMap {
  app_name: string | null;
  company_name: string | null;
  logo_url: string | null;
}

export interface IAppSettingService {
  getAll(): Promise<AppSettingMap>;
  getStoredLogoUrl(): Promise<string | null>;
  upsert(data: { [K in keyof AppSettingMap]?: AppSettingMap[K] | undefined }): Promise<void>;
}
