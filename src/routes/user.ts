import { Router } from "express";
import { PrismaClient } from "../generated/prisma/client.js";
import { UsersRepository } from "../repositories/users_repository.js";
import { ObRepository } from "../repositories/ob_repository.js";
import { LaporanRepository } from "../repositories/laporan_repository.js";
import { UsersService } from "../services/users_service.js";
import { KaryawanService } from "../services/karyawan_service.js";
import { ObService } from "../services/ob_service.js";
import { LaporanService } from "../services/laporan_service.js";
import { UsersController } from "../controllers/users_controller.js";
import { KategoriService } from "../services/kategori_service.js";
import { KategoriRepository } from "../repositories/kategori_repository.js";
import { verifyJWTToken } from "../middleware/jwt.js";

const userRouter = Router();

const db = new PrismaClient();
const userRepo = new UsersRepository(db);
const obRepo = new ObRepository(db);
const laporanRepo = new LaporanRepository(db);
const kategoriRepo = new KategoriRepository(db);
const kategoriService = new KategoriService(kategoriRepo);

const usersService = new UsersService(userRepo);
const karyawanService = new KaryawanService(userRepo, laporanRepo, kategoriService);
const obService = new ObService(obRepo, laporanRepo);
const laporanService = new LaporanService(laporanRepo);

const userController = new UsersController(usersService, karyawanService, obService, laporanService);

userRouter.use(verifyJWTToken);

userRouter.get("/profile", (req, res) => userController.getProfile(req, res));
userRouter.get("/profile/laporan/:laporan_id", (req, res) => userController.getReportDetail(req, res));

export default userRouter;
