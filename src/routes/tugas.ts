import { Router } from "express";
import { PrismaClient } from "../generated/prisma/client.js";
import { TugasRepository } from "../repositories/tugas_repository.js";
import { TugasService } from "../services/tugas_service.js";
import { TugasController } from "../controllers/tugas_controller.js";
import { verifyJWTToken } from "../middleware/jwt.js";
import { requireRole } from "../middleware/role.js";

const tugasRouter = Router();

const db = new PrismaClient();
const tugasRepo = new TugasRepository(db);
const tugasService = new TugasService(tugasRepo);
const tugasController = new TugasController(tugasService);

tugasRouter.use(verifyJWTToken);
tugasRouter.use(requireRole("admin"))

tugasRouter.get('/', (req, res) => tugasController.getAll(req, res));
tugasRouter.get('/:tugas_id', (req, res) => tugasController.getByID(req, res));
tugasRouter.post('/', (req, res) => tugasController.create(req, res));
tugasRouter.patch('/:tugas_id', (req, res) => tugasController.update(req, res));
tugasRouter.delete('/:tugas_id', (req, res) => tugasController.delete(req, res));

export default tugasRouter;
