import { CreateUserSchema, UpdateUserSchema } from "../dto/users.js";
import type { IUsersService } from "../services/users_service.interface.js";
import { sendErrorResponse, sendSuccessfullResponse } from "../utils/response.js";
import type { Request, Response } from "express";

export class UsersController {
    private usersService: IUsersService;

    constructor(usersService: IUsersService) {
        this.usersService = usersService;
    }

    async getAll(req: Request, res: Response) {
        try {
            const page = parseInt(String(req.query.page), 10) || 1;
            const limit = parseInt(String(req.query.limit), 10) || 10;
            const search = req.query.search ? String(req.query.search) : null;

            const response = await this.usersService.getAll(page, limit, search)
            return res.status(200).json(sendSuccessfullResponse("Berhasil mendapatkan data user", response))
        } catch (err: any) {
            return res.status(400).json(sendErrorResponse("Gagal mendapatkan data user", err.message))
        }
    }

    async getByID(req: Request, res: Response) {
        try {
            const userId = req.params.user_id as string;
            
            const response = await this.usersService.getByID(userId)
            return res.status(200).json(sendSuccessfullResponse("Berhasil mendapatkan data user", response))
        } catch (err: any) {
            return res.status(400).json(sendErrorResponse("Gagal mendapatkan data user", err.message))
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
            
            await this.usersService.create(validate.data)
            return res.status(201).json(sendSuccessfullResponse("Berhasil menambahkan data user"));
        } catch (err: any) {
            return res.status(400).json(sendErrorResponse("Gagal mendapatkan data user", err.message))
        }
    }

    async update(req: Request, res: Response) {
        try {
            const userId = req.params.user_id as string;

            if(!req.body){
                return res.status(400).json(sendErrorResponse("Request body empty"))
            };

            const validate = UpdateUserSchema.safeParse(req.body);
            if(!validate.success){
                const formatedErr = validate.error.flatten().fieldErrors;
                return res.status(400).json(sendErrorResponse("Validation Failed", formatedErr));
            }
            
            await this.usersService.update(userId, validate.data)
            return res.status(200).json(sendSuccessfullResponse("Berhasil mengubah data user"));
        } catch (err: any) {
            return res.status(400).json(sendErrorResponse("Gagal mendapatkan data user", err.message))
        }
    }
    
    async delete(req: Request, res: Response) {
        try {
            const userId = req.params.user_id as string;

            await this.usersService.delete(userId)
            return res.status(200).json(sendSuccessfullResponse("Berhasil menghapus data user"));
        } catch (err: any) {
            return res.status(400).json(sendErrorResponse("Gagal mendapatkan data user", err.message))
        }
    }
}