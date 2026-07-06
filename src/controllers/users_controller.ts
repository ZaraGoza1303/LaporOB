import { CreateLaporanKaryawanSchema, CreateUserSchema, UpdateUserSchema } from "../dto/users.js";
import type { IUsersService } from "../services/users_service.interface.js";
import { sendErrorResponse, sendSuccessfullResponse } from "../utils/response.js";
import type { Request, Response } from "express";
import { compressImageIfNeeded, validateImageFile } from "../utils/validate_file.js";
import type { IStorageService } from "../services/storage_service.interface.js";

export class UsersController {
    private usersService: IUsersService;
    private storageService: IStorageService;

    constructor(usersService: IUsersService, storageService: IStorageService) {
        this.usersService = usersService;
        this.storageService = storageService;
    }

    async getAll(req: Request, res: Response) {
        try {
            const page = parseInt(String(req.query.page), 10) || 1;
            const limit = parseInt(String(req.query.limit), 10) || 10;
            const search = req.query.search ? String(req.query.search) : null;

            const response = await this.usersService.getAll(page, limit, search)
            return res.status(200).json(sendSuccessfullResponse("Berhasil mendapatkan data user", response))
        } catch (err: any) {
            return res.status(500).json(sendErrorResponse("Gagal mendapatkan data user", err.message))
        }
    }

    async getByID(req: Request, res: Response) {
        try {
            const userId = req.params.user_id as string;
            
            const response = await this.usersService.getByID(userId)
            return res.status(200).json(sendSuccessfullResponse("Berhasil mendapatkan data user", response))
        } catch (err: any) {
            return res.status(500).json(sendErrorResponse("Gagal mendapatkan data user", err.message))
        }
    }

    async create(req: Request, res: Response) {
        try {
            if(!req.body){
                return res.status(400).json(sendErrorResponse("Request body empty"))
            };

            const validate = CreateUserSchema.safeParse(req.body);
            if(!validate.success){
                const formatedErr = validate.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formatedErr));
            }
            
            const response = await this.usersService.create(validate.data)
            return res.status(201).json(sendSuccessfullResponse("Berhasil menambahkan data user", response.activationUrl));
        } catch (err: any) {
            return res.status(500).json(sendErrorResponse("Gagal menambahkan data user", err.message))
        }
    }

    async update(req: Request, res: Response) {
        try {
            const userId = req.params.user_id as string;
            let profilePicture: string | undefined;

            const validate = UpdateUserSchema.safeParse(req.body);
            if(!validate.success){
                const formatedErr = validate.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formatedErr));
            }

            const existsUser = await this.usersService.getByID(userId);
            if (!existsUser) {
                return res.status(404).json(sendErrorResponse("User tidak ditemukan"));
            }

            if(req.file) {
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
                if(oldFileUrlOrKey) {
                    profilePicture = await this.storageService.updateFile(req.file, oldFileUrlOrKey);
                } else {
                    profilePicture = await this.storageService.uploadFile(req.file)
                }
            }

            const updateData = {
                ...validate.data,
                ...(profilePicture && { profile_picture: profilePicture })
            }
            
            await this.usersService.update(userId, updateData, req.file)
            return res.status(200).json(sendSuccessfullResponse("Berhasil mengubah data user"));
        } catch (err: any) {
            return res.status(500).json(sendErrorResponse("Gagal mengubah data user", err.message))
        }
    }
    
    async delete(req: Request, res: Response) {
        try {
            const userId = req.params.user_id as string;

            await this.usersService.delete(userId)
            return res.status(200).json(sendSuccessfullResponse("Berhasil menghapus data user"));
        } catch (err: any) {
            return res.status(500).json(sendErrorResponse("Gagal menghapus data user", err.message))
        }
    }


    async getHomeStats(req: Request, res: Response) {
        try {
            const userId = req.user?.id as string;

            const response = await this.usersService.getHomeStats(userId)
            return res.status(200).json(sendSuccessfullResponse("Berhasil mendapatkan data home karyawan", response));
        } catch (err: any) {
            return res.status(500).json(sendErrorResponse("Gagal mendapatkan data home karyawan", err.message))
        }
    }

    async createReport(req: Request, res: Response) {
        try {
            const userId = req.user?.id as string;

            if(!req.body){
                return res.status(400).json(sendErrorResponse("Request body empty"))
            };

            const validate = CreateLaporanKaryawanSchema.safeParse(req.body);
            if(!validate.success){
                const formatedErr = validate.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formatedErr));
            }

            const fotoFiles = (req.files as Express.Multer.File[]).filter(
                (file) => file.fieldname === "foto_masalah"
            );

            if (fotoFiles.length === 0) {
                return res.status(400).json(sendErrorResponse("Foto masalah wajib diupload"));
            }

            const fotoUrls: string[] = [];
            for (const file of fotoFiles) {
                const validation = await validateImageFile(file);
                if (!validation.ok) {
                    return res.status(400).json(sendErrorResponse(validation.message));
                }

                try {
                    await compressImageIfNeeded(file);
                } catch (err: any) {
                    return res.status(500).json(sendErrorResponse("Gagal memproses gambar", err.message));
                }

                const url = await this.storageService.uploadFile(file);
                fotoUrls.push(url);
            }

            const response = await this.usersService.createReport(userId, {
                ...validate.data,
                foto_masalah: fotoUrls,
            })
            
            return res.status(201).json(sendSuccessfullResponse("Berhasil menambahkan data laporan", response));
        } catch (err: any) {
            return res.status(500).json(sendErrorResponse("Gagal menambahkan data laporan", err.message))
        }
    }
}