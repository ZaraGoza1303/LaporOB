import type { IAppSettingRepository } from "../repositories/appSetting_repository.interface.js";
import type { IRedisClient } from "../database/redis.interface.js";
import type { IAppSettingService, AppSettingMap } from "./appSetting_service.interface.js";

const CACHE_KEY = "app:settings";
const CACHE_TTL = 300;

const ALLOWED_KEYS = ["app_name", "company_name", "logo_url"];

export class AppSettingService implements IAppSettingService {
  private repo: IAppSettingRepository;
  private redis: IRedisClient;

  constructor(repo: IAppSettingRepository, redis: IRedisClient) {
    this.repo = repo;
    this.redis = redis;
  }

  async getAll(): Promise<AppSettingMap> {
    const cached = await this.redis.get(CACHE_KEY);
    if (cached) return JSON.parse(cached);

    const rows = await this.repo.getAll();

    const settings: AppSettingMap = {
      app_name: null,
      company_name: null,
      logo_url: null,
    };

    for (const row of rows) {
      if (row.value === null) continue;

      if (row.key === "app_name") settings.app_name = row.value;
      else if (row.key === "company_name") settings.company_name = row.value;
      else if (row.key === "logo_url") settings.logo_url = row.value;
    }

    settings.app_name = settings.app_name ?? process.env.APP_NAME ?? null;
    settings.company_name = settings.company_name ?? process.env.COMPANY_NAME ?? null;
    settings.logo_url = settings.logo_url ?? process.env.LOGO_URL ?? null;

    await this.redis.setEx(CACHE_KEY, CACHE_TTL, JSON.stringify(settings));
    return settings;
  }

  async upsert(data: { [K in keyof AppSettingMap]?: AppSettingMap[K] | undefined }): Promise<void> {
    for (const [key, value] of Object.entries(data)) {
      if (ALLOWED_KEYS.includes(key) && (value === null || value !== undefined)) {
        await this.repo.upsert(key, value);
      }
    }
    await this.redis.del(CACHE_KEY);
  }
}
