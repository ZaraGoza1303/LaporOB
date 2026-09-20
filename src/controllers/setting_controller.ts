import type { Request, Response } from "express";
import { sendErrorResponse, sendSuccessfullResponse } from "../utils/response.js";
import type { IAppSettingService, AppSettingMap } from "../services/appSetting_service.interface.js";
import type { IStorageService } from "../services/storage_service.interface.js";
import { UpsertSettingSchema } from "../dto/app_setting.js";
import { AppError } from "../utils/error.js";
import { resolveFileUrl } from "../utils/url.js";
import { processImageFile } from "../utils/validate_file.js";

export class SettingController {
  private settingService: IAppSettingService;
  private storageService: IStorageService;

  constructor(settingService: IAppSettingService, storageService: IStorageService) {
    this.settingService = settingService;
    this.storageService = storageService;
  }

  // logo_url disimpan sebagai path relatif, jadi di-resolve jadi URL absolut saat dikirim ke client
  private mapSettings(settings: AppSettingMap) {
    return {
      ...settings,
      logo_url: resolveFileUrl(settings.logo_url),
    };
  }

  async getAll(_req: Request, res: Response) {
    try {
      const settings = await this.settingService.getAll();
      return res.status(200).json(sendSuccessfullResponse("Berhasil mengambil pengaturan", this.mapSettings(settings)));
    } catch (err: unknown) {
      if (err instanceof AppError) return res.status(err.statusCode).json(sendErrorResponse(err.message));
      return res.status(500).json(sendErrorResponse("Gagal mengambil pengaturan"));
    }
  }

  async getPublic(_req: Request, res: Response) {
    try {
      const settings = await this.settingService.getAll();
      return res.status(200).json(sendSuccessfullResponse("Berhasil mengambil branding", this.mapSettings(settings)));
    } catch (err: unknown) {
      if (err instanceof AppError) return res.status(err.statusCode).json(sendErrorResponse(err.message));
      return res.status(500).json(sendErrorResponse("Gagal mengambil branding"));
    }
  }

  async upsert(req: Request, res: Response) {
    try {
      const logoFile = ((req.files || []) as Express.Multer.File[]).find(
        (file) => file.fieldname === "logo"
      );

      const body: Record<string, unknown> = { ...req.body };
      // FormData multipart kerap ikut mengirim field kosong; kalau file logo dikirim, file itu yang jadi sumber logo
      if (logoFile && body.logo_url === "") delete body.logo_url;

      const validate = UpsertSettingSchema.safeParse(body);
      if (!validate.success) {
        return res.status(400).json(sendErrorResponse("Validation Failed", validate.error.flatten().fieldErrors));
      }

      const payload = { ...validate.data };

      if (logoFile) {
        const processed = await processImageFile(logoFile, "Gagal memproses gambar logo");
        if (!processed.ok) {
          return res.status(processed.status).json(sendErrorResponse(processed.message));
        }

        // Hapus file logo lama hanya kalau memang tersimpan di DB (bukan file default dari env LOGO_URL)
        const oldLogo = await this.settingService.getStoredLogoUrl();
        payload.logo_url = oldLogo
          ? await this.storageService.updateFile(logoFile, oldLogo)
          : await this.storageService.uploadFile(logoFile);
      }

      await this.settingService.upsert(payload);
      const settings = await this.settingService.getAll();
      return res.status(200).json(sendSuccessfullResponse("Pengaturan berhasil disimpan", this.mapSettings(settings)));
    } catch (err: unknown) {
      if (err instanceof AppError) return res.status(err.statusCode).json(sendErrorResponse(err.message));
      return res.status(500).json(sendErrorResponse("Gagal menyimpan pengaturan"));
    }
  }
}
