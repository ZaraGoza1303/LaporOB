import type { IUsersService } from "../services/users_service.interface.js";
import type { IProfileService } from "../services/profile_service.interface.js";
import type { IObService } from "../services/ob_service.interface.js";
import type { ILaporanService } from "../services/laporan_service.interface.js";
import type { IStorageService } from "../services/storage_service.interface.js";
import { CreateUserSchema, UpdateUserSchema, UpdateProfileSchema, ProfileLaporanQuerySchema, UserIdParamSchema, LaporanIdParamSchema } from "../dto/users.js";
import type { ProfileRes, ObProfileResponse, UserProfileResponse } from "../dto/users.js";
import { UserSearchQuerySchema, GetDashboardQuerySchema } from "../dto/admin.js";
import { sendErrorResponse, sendSuccessfullResponse } from "../utils/response.js";
import { compressImageIfNeeded, validateImageFile } from "../utils/validate_file.js";
import type { Request, Response } from "express";
import { AppError } from "../utils/error.js";
import { calculatePeriodRange } from "../utils/date.js";
import type { IKaryawanService } from "../services/karyawan_service.interface.js";
import { USER_ROLE } from "../utils/constants.js";

export class UsersController {
    private usersService: IUsersService;
    private profileService: IProfileService;
    private obService: IObService;
    private karyawanService: IKaryawanService;
    private laporanService: ILaporanService;
    private storageService: IStorageService;

    constructor(
        usersService: IUsersService,
        profileService: IProfileService,
        obService: IObService,
        karyawanService: IKaryawanService,
        laporanService: ILaporanService,
        storageService: IStorageService
    ) {
        this.usersService = usersService;
        this.profileService = profileService;
        this.obService = obService;
        this.karyawanService = karyawanService;
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
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Gagal mendapatkan data user"))
        }
    }

    async getAllOb(req: Request, res: Response) {
        try {
            const response = await this.usersService.getByRole(USER_ROLE.OB)
            return res.status(200).json(sendSuccessfullResponse("Berhasil mendapatkan data ob", response))
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Gagal mendapatkan data user"))
        }
    }

    async getAllKaryawan(req: Request, res: Response) {
        try {
            const response = await this.usersService.getByRole(USER_ROLE.KARYAWAN)
            return res.status(200).json(sendSuccessfullResponse("Berhasil mendapatkan data karyawan", response))
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Gagal mendapatkan data user"))
        }
    }

    async getByID(req: Request, res: Response) {
        try {
            const validate = UserIdParamSchema.safeParse(req.params);
            if (!validate.success) {
                const formatedErr = validate.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formatedErr));
            }

            const userId = validate.data.user_id;
            const response = await this.usersService.getByID(userId);
            if (!response) {
                return res.status(404).json(sendErrorResponse("User tidak ditemukan"));
            }

            return res.status(200).json(sendSuccessfullResponse("Berhasil mendapatkan data user", response))
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Gagal mendapatkan data user"))
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

            await this.usersService.create(validate.data)
            return res.status(201).json(sendSuccessfullResponse("Berhasil menambahkan data user, link aktivasi sudah dikirim ke email user."));
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Gagal menambahkan data user"))
        }
    }

    async update(req: Request, res: Response) {
        try {
            const validateParams = UserIdParamSchema.safeParse(req.params);
            if (!validateParams.success) {
                const formatedErr = validateParams.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formatedErr));
            }

            const userId = validateParams.data.user_id;
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
                } catch (err: unknown) {
                    return res.status(500).json(sendErrorResponse("Gagal memproses/kompres gambar"));
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
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Gagal mengubah data user"))
        }
    }

    async updateProfile(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            let profilePicture: string | undefined;

            if (!userId) {
                return res.status(401).json(sendErrorResponse("Unauthorized: ID user tidak ditemukan dalam token"));
            }

            const validate = UpdateProfileSchema.safeParse(req.body);
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
                } catch (err: unknown) {
                    return res.status(500).json(sendErrorResponse("Gagal memproses/kompres gambar"));
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
            return res.status(200).json(sendSuccessfullResponse("Berhasil mengubah profile"));
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Gagal mengubah profile"))
        }
    }

    async delete(req: Request, res: Response) {
        try {
            const validate = UserIdParamSchema.safeParse(req.params);
            if (!validate.success) {
                const formatedErr = validate.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formatedErr));
            }

            const userId = validate.data.user_id;
            await this.usersService.delete(userId)
            return res.status(200).json(sendSuccessfullResponse("Berhasil menghapus data user"));
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Gagal menghapus data user"))
        }
    }

    async getProfile(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            const role = req.user?.role;

            if (!userId || !role) {
                return res.status(401).json(sendErrorResponse("Unauthorized: ID user atau role tidak ditemukan dalam token"));
            }

            const validate = ProfileLaporanQuerySchema.safeParse(req.query);
            if (!validate.success) {
                const formatedErr = validate.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formatedErr));
            }

            const responseData = await this.profileService.getProfile(userId, role, validate.data);
            return res.status(200).json(sendSuccessfullResponse("Berhasil mendapatkan data profile", responseData));
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Terjadi kesalahan pada server"));
        }
    }

    async getReportDetail(req: Request, res: Response) {
        try {
            const validateParams = LaporanIdParamSchema.safeParse(req.params);
            if (!validateParams.success) {
                const formattedErr = validateParams.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formattedErr));
            }
            const laporanId = validateParams.data.laporan_id;
            const userId = req.user?.id as string;
            const role = req.user?.role as string;
            
            const response = await this.laporanService.getReportDetail(laporanId, userId, role);
            return res.status(200).json(sendSuccessfullResponse("Berhasil mendapatkan detail laporan", response));
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Terjadi kesalahan pada server"));
        }
    }
    
    async getObPerformanceStats(req: Request, res: Response) {
        try {
            const validateParams = UserIdParamSchema.safeParse(req.params);
            if (!validateParams.success) {
                const formatedErr = validateParams.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formatedErr));
            }
            const obId = validateParams.data.user_id;

            const validateQuery = GetDashboardQuerySchema.safeParse(req.query);
            if (!validateQuery.success) {
                const formatedErr = validateQuery.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formatedErr));
            }

            const dateRange = calculatePeriodRange(validateQuery.data.period);
            const response = await this.obService.getObPerformanceStats(obId, dateRange);

            return res.status(200).json(sendSuccessfullResponse("Berhasil mendapatkan statistik performa OB", response));
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message));
            }
            return res.status(500).json(sendErrorResponse("Terjadi kesalahan pada server"));
        }
    }

    async getKarywanPerformanceStats(req: Request, res: Response) {
        try {
            const validateParams = UserIdParamSchema.safeParse(req.params);
            if (!validateParams.success) {
                const formatedErr = validateParams.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formatedErr));
            }

            const karyawanId = validateParams.data.user_id;

            const validateQuery = GetDashboardQuerySchema.safeParse(req.query);
            if (!validateQuery.success) {
                const formatedErr = validateQuery.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formatedErr));
            }

            const response = await this.karyawanService.getKaryawanPerformanceStats(karyawanId);

            return res.status(200).json(sendSuccessfullResponse("Berhasil mendapatkan statistik performa karyawan", response));
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message));
            }
            return res.status(500).json(sendErrorResponse("Terjadi kesalahan pada server"));
        }
    }

    async getRoles(req: Request, res: Response) {
        try {
            const response = await this.usersService.getRoles();
            return res.status(200).json(sendSuccessfullResponse("Berhasil mendapatkan data role", response));
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message))
            }
            return res.status(500).json(sendErrorResponse("Gagal mendapatkan data role"))
        }
    }

    async renewActivationToken(req: Request, res: Response) {
        try {
            const validateParams = UserIdParamSchema.safeParse(req.params);
            if (!validateParams.success) {
                const formatedErr = validateParams.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formatedErr));
            }

            const userId = validateParams.data.user_id;
            await this.usersService.renewActivationToken(userId);

            return res.status(200).json(sendSuccessfullResponse("Berhasil memperbarui token aktivasi, link aktivasi baru sudah dikirim ke email user."));
        } catch (err: unknown) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json(sendErrorResponse(err.message));
            }
            return res.status(500).json(sendErrorResponse("Gagal memperbarui token aktivasi"));
        }
    }
}
