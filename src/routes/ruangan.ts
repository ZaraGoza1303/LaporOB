import { Router } from "express";
import { PrismaClient } from "../generated/prisma/client.js";
import { RuanganRepository } from "../repositories/ruangan_repository.js";
import { RuanganService } from "../services/ruangan_service.js";
import { RuanganController } from "../controllers/ruangan_controller.js";
import { verifyJWTToken } from "../middleware/jwt.js";
import { requireRole } from "../middleware/role.js";

const ruanganRouter = Router();

const db = new PrismaClient();
const ruanganRepo = new RuanganRepository(db);
const ruanganService = new RuanganService(ruanganRepo);
const ruanganController = new RuanganController(ruanganService);

ruanganRouter.use(verifyJWTToken);
ruanganRouter.use(requireRole("admin"))

ruanganRouter.get('/', (req, res) => ruanganController.getAll(req, res));
ruanganRouter.get('/:ruangan_id', (req, res) => ruanganController.getByID(req, res));
ruanganRouter.post('/', (req, res) => ruanganController.create(req, res));
ruanganRouter.patch('/:ruangan_id', (req, res) => ruanganController.update(req, res));
ruanganRouter.delete('/:ruangan_id', (req, res) => ruanganController.delete(req, res));

export default ruanganRouter;
