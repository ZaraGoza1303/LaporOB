import type { Request, Response } from "express";
import { sendErrorResponse, sendSuccessfullResponse } from "../utils/response.js";
import type { IAppSettingService } from "../services/appSetting_service.interface.js";
import { UpsertSettingSchema } from "../dto/app_setting.js";
import { AppError } from "../utils/error.js";

export class SettingController {
  private settingService: IAppSettingService;

  constructor(settingService: IAppSettingService) {
    this.settingService = settingService;
  }

  async getAll(_req: Request, res: Response) {
    try {
      const settings = await this.settingService.getAll();
      return res.status(200).json(sendSuccessfullResponse("Berhasil mengambil pengaturan", settings));
    } catch (err: unknown) {
      if (err instanceof AppError) return res.status(err.statusCode).json(sendErrorResponse(err.message));
      return res.status(500).json(sendErrorResponse("Gagal mengambil pengaturan"));
    }
  }

  async upsert(req: Request, res: Response) {
    try {
      const validate = UpsertSettingSchema.safeParse(req.body);
      if (!validate.success) {
        return res.status(400).json(sendErrorResponse("Validation Failed", validate.error.flatten().fieldErrors));
      }

      await this.settingService.upsert(validate.data);
      const settings = await this.settingService.getAll();
      return res.status(200).json(sendSuccessfullResponse("Pengaturan berhasil disimpan", settings));
    } catch (err: unknown) {
      if (err instanceof AppError) return res.status(err.statusCode).json(sendErrorResponse(err.message));
      return res.status(500).json(sendErrorResponse("Gagal menyimpan pengaturan"));
    }
  }
}
