import { Router } from "express";
import { PrismaClient } from "../generated/prisma/client.js";
import { UsersRepository } from "../repositories/users_repository.js";
import { LaporanRepository } from "../repositories/laporan_repository.js";
import { KaryawanService } from "../services/karyawan_service.js";
import { KaryawanController } from "../controllers/karyawan_controller.js";
import { KategoriService } from "../services/kategori_service.js";
import { KategoriRepository } from "../repositories/kategori_repository.js";
import { verifyJWTToken } from "../middleware/jwt.js";
import { requireRole } from "../middleware/role.js";
import { StorageServiceFactory } from "../services/storage_service.factory.js";

const karyawanRouter = Router();

const db = new PrismaClient();
const userRepo = new UsersRepository(db);
const laporanRepo = new LaporanRepository(db);
const kategoriRepo = new KategoriRepository(db);
const kategoriService = new KategoriService(kategoriRepo);
const karyawanService = new KaryawanService(userRepo, laporanRepo, kategoriService);
const storageService = StorageServiceFactory.getProvider();
const karyawanController = new KaryawanController(karyawanService, storageService);

karyawanRouter.use(verifyJWTToken);
karyawanRouter.use(requireRole("karyawan"));

karyawanRouter.get("/dashboard", (req, res) => karyawanController.getHomeStats(req, res));
karyawanRouter.post("/laporan", (req, res) => karyawanController.createReport(req, res));

export default karyawanRouter;
