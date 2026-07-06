import type { Request, Response } from "express";
import type { IProfileService } from "../services/profile_service.interface.js";
import { sendErrorResponse, sendSuccessfullResponse } from "../utils/response.js";

export class ProfileController {
    private profileService: IProfileService;

    constructor(profileService: IProfileService) {
        this.profileService = profileService;
    }

    async getProfile(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.id; 
            const role = req.user?.role;

            if (!userId || !role) {
                res.status(401).json(sendErrorResponse("Unauthorized: ID user atau role tidak ditemukan dalam token"));
                return;
            }

            const search = (req.query.search as string) || null;
            const status = (req.query.status as string) || null;
            const cursor = (req.query.cursor as string) || null;
            const limit = parseInt(req.query.limit as string) || 10;

            const response = await this.profileService.getProfile(userId, limit, { role, cursor, search, status });

            res.status(200).json(sendSuccessfullResponse("Berhasil mendapatkan data profile", response));
        } catch (err: any) {
            res.status(500).json(sendErrorResponse("Terjadi kesalahan pada server"));
        }
    }
}