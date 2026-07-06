import { Router } from "express";
import { PrismaClient } from "../generated/prisma/client.js";
import { UsersRepository } from "../repositories/users_repository.js";
import { UsersService } from "../services/users_service.js";
import { UsersController } from "../controllers/users_controller.js";
import { verifyJWTToken } from "../middleware/jwt.js";
import { requireRole } from "../middleware/role.js";
import { StorageServiceFactory } from '../services/storage_service.factory.js';
import { KategoriService } from "../services/kategori_service.js";
import { KategoriRepository } from "../repositories/kategori_repository.js";

const userRouter = Router();

const db = new PrismaClient();
const userRepo = new UsersRepository(db);
const kategoriRepo = new KategoriRepository(db);

const kategoriService = new KategoriService(kategoriRepo)
const userService = new UsersService(userRepo, kategoriService);

const storageService = StorageServiceFactory.getProvider();
const userController = new UsersController(userService, storageService);

userRouter.use(verifyJWTToken);

userRouter.get("/profile", (req, res) => userController.getProfile(req, res));
userRouter.get("/profile/report/:report_id", (req, res) => userController.getReportDetail(req, res));
userRouter.get("/dashboard", requireRole("karyawan"), (req, res) => userController.getHomeStats(req, res));
userRouter.get("/", requireRole("admin"), (req, res) => userController.getAll(req, res));
userRouter.get("/:user_id", requireRole("admin"), (req, res) => userController.getByID(req, res));
userRouter.post("/", requireRole("admin"), (req, res) => userController.create(req, res));
userRouter.post("/laporan", (req, res) => userController.createReport(req, res));
userRouter.patch("/:user_id", requireRole("admin"), (req, res) => userController.update(req, res));
userRouter.delete("/:user_id", requireRole("admin"), (req, res) => userController.delete(req, res));

export default userRouter;