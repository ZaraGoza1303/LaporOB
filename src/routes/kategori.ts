import { Router } from "express";
import { PrismaClient } from "../generated/prisma/client.js";
import { KategoriRepository } from "../repositories/kategori_repository.js";
import { KategoriService } from "../services/kategori_service.js";
import { KategoriController } from "../controllers/kategori_controller.js";
import { verifyJWTToken } from "../middleware/jwt.js";
import { requireRole } from "../middleware/role.js";

const kategoriRouter = Router();

const db = new PrismaClient();
const kategoriRepo = new KategoriRepository(db);
const kategoriService = new KategoriService(kategoriRepo);
const kategoriController = new KategoriController(kategoriService);

kategoriRouter.use(verifyJWTToken);
kategoriRouter.use(requireRole("admin"))

kategoriRouter.get('/', (req, res) => kategoriController.getAll(req, res));
kategoriRouter.get('/:kategori_id', (req, res) => kategoriController.getByID(req, res));
kategoriRouter.post('/', (req, res) => kategoriController.create(req, res));
kategoriRouter.put('/:kategori_id', (req, res) => kategoriController.update(req, res));
kategoriRouter.delete('/:kategori_id', (req, res) => kategoriController.delete(req, res));

export default kategoriRouter;