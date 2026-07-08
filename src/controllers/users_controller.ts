import type { IUsersService } from "../services/users_service.interface.js";
import type { IKaryawanService } from "../services/karyawan_service.interface.js";
import type { IObService } from "../services/ob_service.interface.js";
import type { ILaporanService } from "../services/laporan_service.interface.js";
import type { IStorageService } from "../services/storage_service.interface.js";
import { CreateUserSchema, UpdateUserSchema, ProfileLaporanQuerySchema } from "../dto/users.js";
import { UserSearchQuerySchema } from "../dto/admin.js";
import { sendErrorResponse, sendSuccessfullResponse } from "../utils/response.js";
import { compressImageIfNeeded, validateImageFile } from "../utils/validate_file.js";
import type { Request, Response } from "express";
import { AppError } from "../utils/error.js";

export class UsersController {
    private usersService: IUsersService;
    private karyawanService: IKaryawanService;
    private obService: IObService;
    private laporanService: ILaporanService;
    private storageService: IStorageService;

    constructor(
        usersService: IUsersService,
        karyawanService: IKaryawanService,
        obService: IObService,
        laporanService: ILaporanService,
        storageService: IStorageService
    ) {
        this.usersService = usersService;
        this.karyawanService = karyawanService;
        this.obService = obService;
        this.laporanService = laporanService;
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

            const response = await this.usersService.getAll(page, limit, validate.data)
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

            const response = await this.usersService.getByID(userId)
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

            const response = await this.usersService.create(validate.data)
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

            const existsUser = await this.usersService.getByID(userId);
            if (!existsUser) {
                return res.status(404).json(sendErrorResponse("User tidak ditemukan"));
            }

            const profilePictureFile = ((req.files || []) as Express.Multer.File[]).find(
                (file) => file.fieldname === "profile_picture"
            );
            if (profilePictureFile) {
                const validation = await validateImageFile(profilePictureFile);
                if (!validation.ok) {
                    return res.status(400).json(sendErrorResponse(validation.message));
                }

                try {
                    await compressImageIfNeeded(profilePictureFile);
                } catch (err: any) {
                    return res.status(500).json(sendErrorResponse("Gagal memproses/kompres gambar", err.message));
                }

                const oldFileUrlOrKey = existsUser.profile_picture;
                if (oldFileUrlOrKey) {
                    profilePicture = await this.storageService.updateFile(profilePictureFile, oldFileUrlOrKey);
                } else {
                    profilePicture = await this.storageService.uploadFile(profilePictureFile)
                }
            }

            const updateData = {
                ...validate.data,
                ...(profilePicture && { profile_picture: profilePicture })
            }

            await this.usersService.update(userId, updateData)
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

            await this.usersService.delete(userId)
            return res.status(200).json(sendSuccessfullResponse("Berhasil menghapus data user"));
        } catch (err: any) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Gagal menghapus data user", err.message))
        }
    }

    async getProfile(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            const role = req.user?.role;

            if (!userId || !role) {
                res.status(401).json(sendErrorResponse("Unauthorized: ID user atau role tidak ditemukan dalam token"));
                return;
            }

            const validate = ProfileLaporanQuerySchema.safeParse(req.query);
            if (!validate.success) {
                const formatedErr = validate.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formatedErr));
            }

            const { search, status, cursor, limit } = validate.data;

            const userProfile = await this.usersService.getProfile(userId);

            const laporan = role.toLowerCase() === "ob"
                ? await this.obService.getRiwayat(userId, limit, { cursor, search, status })
                : await this.karyawanService.getRiwayat(userId, limit, { cursor, search, status });

            return res.status(200).json(sendSuccessfullResponse("Berhasil mendapatkan data profile", {
                user: userProfile,
                laporan
            }));
        } catch (err: any) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Terjadi kesalahan pada server", err.message));
        }
    }

    async getReportDetail(req: Request, res: Response) {
        try {
            const laporanId = req.params.laporan_id as string;
            const response = await this.laporanService.getReportDetail(laporanId);
            return res.status(200).json(sendSuccessfullResponse("Berhasil mendapatkan detail laporan", response));
        } catch (err: any) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Terjadi kesalahan pada server", err.message));
        }
    }
}
