import { Router } from "express";
import { PrismaClient } from "../generated/prisma/client.js";
import { LokasiRepository } from "../repositories/lokasi_repository.js";
import { LokasiService } from "../services/lokasi_service.js";
import { LokasiController } from "../controllers/lokasi_controller.js";
import { authorizeRole, verifyJWTToken } from "../middleware/jwt.js";
import { requireRole } from "../middleware/role.js";

const lokasiRouter = Router();

const db = new PrismaClient();
const lokasiRepo = new LokasiRepository(db);
const lokasiService = new LokasiService(lokasiRepo);
const lokasiController = new LokasiController(lokasiService);

lokasiRouter.use(verifyJWTToken);
lokasiRouter.use(authorizeRole("admin"))

lokasiRouter.get('/', (req, res) => lokasiController.getAll(req, res));
lokasiRouter.get('/:lokasi_id', (req, res) => lokasiController.getByID(req, res));
lokasiRouter.post('/', requireRole("admin"), (req, res) => lokasiController.create(req, res));
lokasiRouter.patch('/:lokasi_id', requireRole("admin"), (req, res) => lokasiController.update(req, res));
lokasiRouter.delete('/:lokasi_id', requireRole("admin"), (req, res) => lokasiController.delete(req, res));

export default lokasiRouter;
