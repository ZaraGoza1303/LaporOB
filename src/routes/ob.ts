import { Router } from "express";
import { PrismaClient } from "../generated/prisma/client.js";
import { ObRepository } from "../repositories/ob_repository.js";
import { LaporanRepository } from "../repositories/laporan_repository.js";
import { ObService } from "../services/ob_service.js";
import { ObController } from "../controllers/ob_controller.js"; 
import { verifyJWTToken } from "../middleware/jwt.js";
import { requireRole } from "../middleware/role.js";
import { StorageServiceFactory } from "../services/storage_service.factory.js";

const obRouter = Router();

const db = new PrismaClient();
const obRepo = new ObRepository(db);
const laporanRepo = new LaporanRepository(db);
const obService = new ObService(obRepo, laporanRepo);
const storageService = StorageServiceFactory.getProvider();
const obController = new ObController(obService, storageService);

obRouter.use(verifyJWTToken);
obRouter.use(requireRole("ob"));

obRouter.get("/dashboard", (req, res) => obController.getHomeStats(req, res));
obRouter.patch("/laporan/:laporan_id", (req, res) => obController.takeLapor(req, res));
obRouter.post("/laporan/:laporan_id/histori", (req, res) => obController.submitHistori(req, res));
obRouter.post("/laporan/:laporan_id/tolak", (req, res) => obController.rejectLapor(req, res));

export default obRouter;
