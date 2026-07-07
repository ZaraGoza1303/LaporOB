import { Router } from "express";
import { PrismaClient } from "../generated/prisma/client.js";
import { LantaiRepository } from "../repositories/lantai_repository.js";
import { LantaiService } from "../services/lantai_service.js";
import { LantaiController } from "../controllers/lantai_controller.js";
import { verifyJWTToken } from "../middleware/jwt.js";
import { requireRole } from "../middleware/role.js";

const lantaiRouter = Router();

const db = new PrismaClient();
const lantaiRepo = new LantaiRepository(db);
const lantaiService = new LantaiService(lantaiRepo);
const lantaiController = new LantaiController(lantaiService);

lantaiRouter.use(verifyJWTToken);
lantaiRouter.use(requireRole("admin"))

lantaiRouter.get('/', (req, res) => lantaiController.getAll(req, res));
lantaiRouter.get('/:lantai_id', (req, res) => lantaiController.getByID(req, res));
lantaiRouter.post('/', (req, res) => lantaiController.create(req, res));
lantaiRouter.patch('/:lantai_id', (req, res) => lantaiController.update(req, res));
lantaiRouter.delete('/:lantai_id', (req, res) => lantaiController.delete(req, res));

export default lantaiRouter;
