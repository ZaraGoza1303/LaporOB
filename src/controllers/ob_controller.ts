import type { Request, Response } from "express";
import type { IObService } from "../services/ob_service.interface.js";
import { sendSuccessfullResponse, sendErrorResponse } from "../utils/response.js";

export class ObController {
    private obService: IObService;

    constructor(obService: IObService) {
        this.obService = obService;
    }

    async getHomeStats(req: Request, res: Response) {
        try {
            const obId = req.user?.id;
            if (!obId) {
                return res.status(401).json(sendErrorResponse("Unauthorized - ID user tidak ditemukan dalam token"));
            }

            const response = await this.obService.getHomeStats(obId);
            return res.status(200).json(sendSuccessfullResponse("Berhasil mendapatkan data dashboard OB/beranda", response));
        } catch (err: any) {
            return res.status(400).json(sendErrorResponse("Gagal mendapatkan data dashboard OB", err.message));
        }
    }
}
