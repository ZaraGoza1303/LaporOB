import type { Request, Response } from "express";
import type { IObService } from "../services/ob_service.interface.js";
import { sendSuccessfullResponse, sendErrorResponse } from "../utils/response.js";
import type { IStorageService } from "../services/storage_service.interface.js";
import { UpdateLaporanSchema, type UpdateLaporanReq } from "../dto/ob.js";
import { compressImageIfNeeded, validateImageFile } from "../utils/validate_file.js";


export class ObController {
    private obService: IObService;
    private storageService: IStorageService;

    constructor(obService: IObService, storageService: IStorageService) {
        this.obService = obService;
        this.storageService = storageService;
    }

    async getHomeStats(req: Request, res: Response) {
        try {
            const obId = req.user?.id as string;

            const response = await this.obService.getHomeStats(obId);
            return res.status(200).json(sendSuccessfullResponse("Berhasil mendapatkan data home OB", response));
        } catch (err: any) {
            return res.status(400).json(sendErrorResponse("Gagal mendapatkan data dashboard OB", err.message));
        }
    }


async updatelapor(req: Request, res: Response) {
      try {
        if (!req.body){
            return res.status(400).json(sendErrorResponse("Request Body Empty"))
        }

        const validate =UpdateLaporanSchema.safeParse({
            ...req.body,
            foto: req.file? "file_tersedia" : undefined
        });
        
        if (!validate.success){
            const formatedErr = validate.error.flatten().fieldErrors;
            return res.status(400).json(sendErrorResponse("Validation failed", formatedErr));
        }

        const laporanId = req.params.laporanId as string;
        const obId = req.user?.id as string;
        let fotoLaporan: string | undefined;

      if (req.file) {
            const validation = await validateImageFile(req.file);
            if (!validation.ok) {
                return res.status(400).json(sendErrorResponse(validation.message)); 
            }

            try {
                await compressImageIfNeeded(req.file); 
            } catch (err: any) {
                return res.status(500).json(sendErrorResponse("Gagal memproses Gambar"));
            }

            fotoLaporan = await this.storageService.uploadFile(req.file);
            }

        const dto: UpdateLaporanReq = {
            ...validate.data,
            ...(fotoLaporan && { foto: fotoLaporan })
        };

        await  this.obService.updatelaporStatus(laporanId, obId, dto);

        return res.status(200).json(sendSuccessfullResponse("Status laporan berhasil diperbarui"));
      } catch (err: any){
        return res.status(500).json(sendErrorResponse("Terjadi kesalahan, tidak bisa memperbarui laporan"))
      }
    }
}