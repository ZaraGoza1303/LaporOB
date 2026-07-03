import type { Request, Response } from "express";
import type { IObService } from "../services/ob_service.interface.js";
import { sendSuccessfullResponse, sendErrorResponse } from "../utils/response.js";
import { success } from "zod";

export class ObController {
    private obService: IObService;

    constructor(obService: IObService) {
        this.obService = obService;
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
            const laporanId = req.params.laporanId as string;
            const obId = ( req as any).user.id;
            const dto = req.body;

            await this.obService.updatelaporStatus(laporanId, obId, dto);

            return res.status(200).json({
                success : true,
                message: "Status Laporan Berhasil Diperbarui"
            });
        } catch (err :any) {
            return res.status(err.status || 500).json({
                success : false,
                message : "Terjadi kesalahan internal"
            });
        }
    }
}
