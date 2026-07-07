import { CreateUserSchema, UpdateUserSchema } from "../dto/users.js";
import type { IAdminService } from "../services/admin_service.interface.js";
import { sendErrorResponse, sendSuccessfullResponse } from "../utils/response.js";
import type { Request, Response } from "express";
import { compressImageIfNeeded, validateImageFile } from "../utils/validate_file.js";
import type { IStorageService } from "../services/storage_service.interface.js";
import { AppError } from "../utils/error.js";
import { UserSearchQuerySchema } from "../dto/admin.js";

export class AdminController {
    private adminService: IAdminService;
    private storageService: IStorageService;

    constructor(adminService: IAdminService, storageService: IStorageService) {
        this.adminService = adminService;
        this.storageService = storageService;
    }

    async getAll(req: Request, res: Response) {
        try {
            const page = parseInt(String(req.query.page), 10) || 1;
            const limit = parseInt(String(req.query.limit), 10) || 10;

            const validate = UserSearchQuerySchema.safeParse(req.query);
            if (!validate.success) {
                const formatedErr = validate.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formatedErr));
            }

            const response = await this.adminService.getAll(page, limit, validate.data)
            return res.status(200).json(sendSuccessfullResponse("Berhasil mendapatkan data user", response))
        } catch (err: any) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Gagal mendapatkan data user", err.message))
        }
    }

    async getByID(req: Request, res: Response) {
        try {
            const userId = req.params.user_id as string;

            const response = await this.adminService.getByID(userId)
            return res.status(200).json(sendSuccessfullResponse("Berhasil mendapatkan data user", response))
        } catch (err: any) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Gagal mendapatkan data user", err.message))
        }
    }

    async create(req: Request, res: Response) {
        try {
            if (!req.body) {
                return res.status(400).json(sendErrorResponse("Request body empty"))
            };

            const validate = CreateUserSchema.safeParse(req.body);
            if (!validate.success) {
                const formatedErr = validate.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formatedErr));
            }

            const response = await this.adminService.create(validate.data)
            return res.status(201).json(sendSuccessfullResponse("Berhasil menambahkan data user", response.activationUrl));
        } catch (err: any) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Gagal menambahkan data user", err.message))
        }
    }

    async update(req: Request, res: Response) {
        try {
            const userId = req.params.user_id as string;
            let profilePicture: string | undefined;

            const validate = UpdateUserSchema.safeParse(req.body);
            if (!validate.success) {
                const formatedErr = validate.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formatedErr));
            }

            const existsUser = await this.adminService.getByID(userId);
            if (!existsUser) {
                return res.status(404).json(sendErrorResponse("User tidak ditemukan"));
            }

            if (req.file) {
                const validation = await validateImageFile(req.file);
                if (!validation.ok) {
                    return res.status(400).json(sendErrorResponse(validation.message));
                }

                try {
                    await compressImageIfNeeded(req.file);
                } catch (err: any) {
                    return res.status(500).json(sendErrorResponse("Gagal memproses/kompres gambar", err.message));
                }

                const oldFileUrlOrKey = existsUser.profile_picture;
                if (oldFileUrlOrKey) {
                    profilePicture = await this.storageService.updateFile(req.file, oldFileUrlOrKey);
                } else {
                    profilePicture = await this.storageService.uploadFile(req.file)
                }
            }

            const updateData = {
                ...validate.data,
                ...(profilePicture && { profile_picture: profilePicture })
            }

            await this.adminService.update(userId, updateData, req.file)
            return res.status(200).json(sendSuccessfullResponse("Berhasil mengubah data user"));
        } catch (err: any) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Gagal mengubah data user", err.message))
        }
    }

    async delete(req: Request, res: Response) {
        try {
            const userId = req.params.user_id as string;

            await this.adminService.delete(userId)
            return res.status(200).json(sendSuccessfullResponse("Berhasil menghapus data user"));
        } catch (err: any) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Gagal menghapus data user", err.message))
        }
    }

    async getUserStats(req: Request, res: Response) {
       try {
            await this.adminService.getUserStats()
            return res.status(200).json(sendSuccessfullResponse("Berhasil mendapatkan data"));
        } catch (err: any) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Gagal mendapatkan data", err.message))
        }
    }
}
