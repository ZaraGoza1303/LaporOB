import type { Request, Response } from "express";
import type { IProfileService } from "../services/profile_service.interface.js";
import { sendErrorResponse, sendSuccessfullResponse } from "../utils/response.js";

export class ProfileController {
    private profileService: IProfileService;

    constructor(profileService: IProfileService) {
        this.profileService = profileService;
    }

    async getProfile(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json(sendErrorResponse("Unauthorized - ID user tidak ditemukan dalam token"));
            }

            const search = req.query.search ? String(req.query.search) : null;
            const status = req.query.status ? String(req.query.status) : null;
            const cursor = req.query.cursor ? String(req.query.cursor) : null;
            const limit = Math.min(parseInt(String(req.query.limit), 10) || 10, 50);

            const response = await this.profileService.getProfile(userId, limit, cursor, search, status);
            return res.status(200).json(sendSuccessfullResponse("Berhasil mendapatkan data profile user", response));
        } catch (err: any) {
            return res.status(400).json(sendErrorResponse("Gagal mendapatkan data profile user", err.message));
        }
    }
}
