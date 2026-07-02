import { Router } from "express";
import { PrismaClient } from "../generated/prisma/client.js";
import { KategoriRepository } from "../repositories/kategori_repository.js";
import { KategoriService } from "../services/kategori_service.js";
import { KategoriController } from "../controllers/kategori_controller.js";

const router = Router();

const db = new PrismaClient();
const kategoriRepository = new KategoriRepository(db);
const kategoriService = new KategoriService(kategoriRepository);
const kategoriController = new KategoriController(kategoriService);

router.get("/", (req, res) => kategoriController.getAllKategori(req, res));
router.get("/:id", (req, res) => kategoriController.getKategoriById(req, res));
router.post("/", (req, res) => kategoriController.createKategori(req, res));
router.put("/:id", (req, res) => kategoriController.updateKategori(req, res));

export default router;