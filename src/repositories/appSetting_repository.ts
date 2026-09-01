import type { PrismaClient } from "../generated/prisma/client.js";
import type { IAppSettingRepository } from "./appSetting_repository.interface.js";

export class AppSettingRepository implements IAppSettingRepository {
  private db: PrismaClient;

  constructor(db: PrismaClient) {
    this.db = db;
  }

  async getAll(): Promise<Array<{ key: string; value: string | null }>> {
    const rows = await this.db.appSetting.findMany({
      select: { key: true, value: true },
    });
    return rows;
  }

  async upsert(key: string, value: string | null): Promise<void> {
    await this.db.appSetting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
  }
}
