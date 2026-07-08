import { Router } from "express";
import { verifyJWTToken } from "../middleware/jwt.js";
import { requireRole } from "../middleware/role.js";
import { PrismaClient } from "../generated/prisma/client.js";
import { UsersRepository } from "../repositories/users_repository.js";
import { UsersService } from "../services/users_service.js";
import { UsersController } from "../controllers/users_controller.js";
import { LaporanRepository } from "../repositories/laporan_repository.js";
import { LaporanService } from "../services/laporan_service.js";
import { KategoriRepository } from "../repositories/kategori_repository.js";
import { KategoriService } from "../services/kategori_service.js";
import { KaryawanService } from "../services/karyawan_service.js";
import { ObService } from "../services/ob_service.js";
import { ObRepository } from "../repositories/ob_repository.js";
import { StorageServiceFactory } from "../services/storage_service.factory.js";
import multer from 'multer';

const userRouter = Router();
const db = new PrismaClient();
const upload = multer({ storage: multer.memoryStorage() });

// Repositories
const usersRepository = new UsersRepository(db);
const laporanRepository = new LaporanRepository(db);
const kategoriRepository = new KategoriRepository(db);
const obRepository = new ObRepository(db);

// Services
const kategoriService = new KategoriService(kategoriRepository);
const usersService = new UsersService(usersRepository);
const karyawanService = new KaryawanService(usersRepository, laporanRepository, kategoriService);
const obService = new ObService(obRepository, laporanRepository);
const laporanService = new LaporanService(laporanRepository);
const storageService = StorageServiceFactory.getProvider();

const userController = new UsersController(
    usersService,
    karyawanService,
    obService,
    laporanService,
    storageService
);

// Protected routes
userRouter.use(verifyJWTToken);

// Self profile
userRouter.get("/profile", (req, res) => userController.getProfile(req, res));
userRouter.get("/profile/laporan/:laporan_id", (req, res) => userController.getReportDetail(req, res));

// Admin user CRUD 
userRouter.get("/admin/user", requireRole("admin"), (req, res) => userController.getAll(req, res));
userRouter.get("/admin/user/:user_id", requireRole("admin"), (req, res) => userController.getByID(req, res));
userRouter.post("/admin/user", requireRole("admin"), (req, res) => userController.create(req, res));
userRouter.patch("/admin/user/:user_id", requireRole("admin"), upload.single("profile_picture"), (req, res) => userController.update(req, res));
userRouter.delete("/admin/user/:user_id", requireRole("admin"), (req, res) => userController.delete(req, res));

export default userRouter;
