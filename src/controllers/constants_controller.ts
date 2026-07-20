import type { Request, Response } from "express";
import { sendSuccessfullResponse } from "../utils/response.js";
import type { IConstantsService } from "../services/constants_service.interface.js";

export class ConstantsController {
    private constantsService: IConstantsService;

    constructor(constantsService: IConstantsService) {
        this.constantsService = constantsService;
    }

    async getConstants(req: Request, res: Response) {
        const data = this.constantsService.getConstants();
        return res.status(200).json(sendSuccessfullResponse("Berhasil mengambil konstanta aplikasi", data));
    }
}
