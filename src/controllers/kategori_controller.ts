import type { Request, Response } from "express";
import { KategoriService } from "../services/kategori_service.js"; 
import { CreateCategorySchema, UpdateCategorySchema } from "../dto/kategori.js";
import { sendErrorResponse, sendSuccessfullResponse } from "../utils/response.js";

export class KategoriController {
    private kategoriService: KategoriService;

    constructor(kategoriService: KategoriService) {
        this.kategoriService = kategoriService;
    }

    async createKategori(req: Request, res: Response) {
        try {
            if(!req.body){
                return res.status(400).json(sendErrorResponse("Request body empty"))
            };

            const validate = CreateCategorySchema.safeParse(req.body);
            if(!validate.success){
                const formattedErr = validate.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr))
            }

            // Sekarang aman dipanggil via properti class ini
            const result = await this.kategoriService.createKategori(validate.data);
            return res.status(201).json(sendSuccessfullResponse("Kategori berhasil dibuat", result));
        } catch (err: any) {
            return res.status(400).json(sendErrorResponse("Gagal membuat kategori", err.message));
        }
    }

    async updateKategori(req: Request, res: Response) {
        try {
            if(!req.body){
                return res.status(400).json(sendErrorResponse("Request body empty"))
            };

            const validate = UpdateCategorySchema.safeParse(req.body);
            if(!validate.success){
                const formattedErr = validate.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr))
            }

            const { id } = req.params; 

            if (!id || typeof id !== 'string') {
                return res.status(400).json(sendErrorResponse("ID tidak valid atau kosong"));
            }

            const result = await this.kategoriService.updateKategori(id, validate.data);
            return res.status(200).json(sendSuccessfullResponse("Kategori berhasil diupdate", result));
        } catch (err: any) {
            return res.status(400).json(sendErrorResponse("Gagal mengupdate kategori", err.message));
        }
    }

    async getKategoriById(req: Request, res: Response) {
        try {
            const { id } = req.params;

            if (!id || typeof id !== 'string') {
                return res.status(400).json(sendErrorResponse("ID tidak valid"));
            }

            const result = await this.kategoriService.getKategoriById(id);
            
            if (!result) {
                return res.status(404).json(sendErrorResponse("Kategori tidak ditemukan"));
            }

            return res.status(200).json(sendSuccessfullResponse("Kategori ditemukan", result));
        } catch (err: any) {
            return res.status(400).json(sendErrorResponse("Gagal mendapatkan kategori", err.message));
        }
    }

    async getAllKategori(req: Request, res: Response) {
        try {
            const page = parseInt(req.query.page as string, 10) || 1;
            const limit = parseInt(req.query.limit as string, 10) || 10;
            const search = (req.query.search as string) || null;
            
            const result = await this.kategoriService.getAllKategori(page, limit, search);
            return res.status(200).json(sendSuccessfullResponse("Daftar kategori berhasil didapatkan", result));
        } catch (err: any) {
            return res.status(400).json(sendErrorResponse("Gagal mendapatkan daftar kategori", err.message));
        }
    }
}